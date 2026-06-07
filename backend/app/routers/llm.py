"""LLM API router — DeepSeek-powered features (NLP parse, summary, schedule, agent, etc.)."""

import json
from fastapi import APIRouter, HTTPException, Depends
from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.llm import (
    NLPParseRequest, NLPParseResponse,
    WeeklySummaryRequest, WeeklySummaryResponse,
    SmartScheduleRequest, SmartScheduleResponse, SmartScheduleAssignment,
    BreakdownRequest, BreakdownResponse, BreakdownSubTask,
    SuggestPlanRequest, SuggestPlanResponse,
    AnomalyCheckRequest, AnomalyCheckResponse, AnomalyItem,
)

router = APIRouter(prefix="/api/llm", tags=["llm"])


def _get_client() -> OpenAI:
    return OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )


def _call_llm(system_prompt: str, user_message: str, response_format: dict | None = None) -> str:
    """Call DeepSeek and return the response content."""
    client = _get_client()
    kwargs = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.3,
    }
    if response_format:
        kwargs["response_format"] = response_format

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# NLP Task Parsing
# ---------------------------------------------------------------------------
NLP_SYSTEM_PROMPT = """你是一个任务解析器。用户会用自然语言描述一个任务，你需要提取结构化信息。
返回严格的 JSON 格式，不要包含任何其他文字。

输出格式:
{
  "title": "任务标题",
  "description": "任务描述（如果有的话，否则空字符串）",
  "estimated_minutes": 预估分钟数(整数),
  "priority": "P0/P1/P2/P3",
  "hard_deadline": "YYYY-MM-DD 或 null",
  "scheduled_date": "YYYY-MM-DD 或 null",
  "scheduled_time": "HH:MM 或 null",
  "category_names": ["分类1", "分类2"]
}

优先级判断:
- P0: 紧急且重要, 今天必须完成
- P1: 重要但不紧急, 本周内
- P2: 常规任务
- P3: 可以推迟

时间词映射:
- "今天" = 今天的日期
- "明天" = 明天的日期
- "后天" = 后天的日期
- "下周一/二..." = 下周对应的日期
- "下午3点" = 15:00
- "上午9点" = 09:00
- "晚上8点" = 20:00
- "2h/两小时/2个小时" = 120分钟
- "半小时" = 30分钟
- "1个半小时" = 90分钟

分类识别 (category_names):
- 学习/课程/作业/考试/复习 → "学习"
- 工作/代码/开发/项目 → "工作"
- 运动/跑步/健身/锻炼 → "运动"
- 生活/购物/做饭/打扫 → "生活"
- 阅读/读书 → "阅读"

如果用户没有明确指定分类，根据任务内容推断。"""


@router.post("/parse-task", response_model=NLPParseResponse)
def parse_task_nlp(data: NLPParseRequest):
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API key not configured")

    from datetime import date as date_type
    today_str = date_type.today().isoformat()

    user_msg = f"今天的日期是 {today_str}。请解析以下任务描述:\n\n{data.text}"

    try:
        result = _call_llm(NLP_SYSTEM_PROMPT, user_msg)
        parsed = json.loads(result)
        return NLPParseResponse(**parsed)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Weekly Summary
# ---------------------------------------------------------------------------
SUMMARY_SYSTEM_PROMPT = """你是一个个人效率分析师。根据用户提供的一周任务数据，生成一段简洁、有洞察力的周报总结（中文）。

总结应包含:
1. 本周总体完成情况（完成率、完成数量）
2. 各分类时间投入概况
3. 亮点和进步
4. 需要改进的地方和下周建议

控制在 200-400 字以内，语气温暖鼓励。"""


@router.post("/weekly-summary", response_model=WeeklySummaryResponse)
def weekly_summary(data: WeeklySummaryRequest):
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API key not configured")

    user_msg = (
        f"日期范围: {data.start_date} 到 {data.end_date}\n"
        f"任务数据:\n{data.tasks_json}"
    )

    try:
        result = _call_llm(SUMMARY_SYSTEM_PROMPT, user_msg)
        return WeeklySummaryResponse(summary=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Smart Schedule
# ---------------------------------------------------------------------------
SCHEDULE_SYSTEM_PROMPT = """你是一个智能排期助手。用户有一批在任务池中的任务和一段日历上的空闲时间。
你需要合理地给任务分配日期和时间，考虑以下因素:
1. 优先级: P0 > P1 > P2 > P3
2. 硬性截止日: 必须在截止日之前安排
3. 预估耗时: 每天安排的任务总耗时不超过 8 小时（480分钟）
4. 难度分散: 不同类别的任务尽量分散到不同天
5. 精力曲线: 复杂任务安排在上午，简单任务安排在下午

返回严格的 JSON 格式:
{
  "assignments": [
    {"task_id": 数字, "scheduled_date": "YYYY-MM-DD", "scheduled_time": "HH:MM 或 null", "reason": "简短的解释"},
    ...
  ]
}

只返回有把握的分配，不确定的任务可以跳过。"""


@router.post("/smart-schedule", response_model=SmartScheduleResponse)
def smart_schedule(data: SmartScheduleRequest):
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API key not configured")

    user_msg = (
        f"请为以下任务分配日期（范围: {data.start_date} 到 {data.end_date}）:\n"
        f"任务 ID 列表: {data.pool_task_ids}\n"
        f"请调用系统中的任务详情来获取每个任务的完整信息。"
    )

    try:
        result = _call_llm(SCHEDULE_SYSTEM_PROMPT, user_msg)
        parsed = json.loads(result)
        return SmartScheduleResponse(**parsed)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Task Breakdown
# ---------------------------------------------------------------------------
BREAKDOWN_SYSTEM_PROMPT = """你是一个任务拆解专家。用户给你一个大目标，你需要把它拆解为具体的子任务。
每个子任务应该是可执行、可衡量的独立步骤。

规则:
1. 拆解 3-8 个子任务
2. 每个子任务有标题、描述、预估时间（分钟）、优先级
3. 子任务按执行顺序排列
4. 总预估时间不应过于夸张（单个子任务不超过 4 小时）
5. 考虑学习和准备时间

返回严格的 JSON 格式:
{
  "sub_tasks": [
    {"title": "...", "description": "...", "estimated_minutes": 数字, "priority": "P0/P1/P2/P3"},
    ...
  ]
}"""


@router.post("/breakdown", response_model=BreakdownResponse)
def breakdown_task(data: BreakdownRequest):
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API key not configured")

    deadline_msg = f"截止日期是 {data.deadline}" if data.deadline else "没有特定截止日期"
    user_msg = f"目标: {data.goal}\n{deadline_msg}"

    try:
        result = _call_llm(BREAKDOWN_SYSTEM_PROMPT, user_msg)
        parsed = json.loads(result)
        return BreakdownResponse(**parsed)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Suggest Daily Plan
# ---------------------------------------------------------------------------
PLAN_SYSTEM_PROMPT = """你是一个每日计划助手。根据用户当天已安排的任务、任务池中的待办事项、以及今天的特殊标记，
生成一份今日建议执行计划。

返回严格的 JSON 格式:
{
  "plan": "一段人性化的今日计划描述（100-200字）",
  "suggestions": [
    {"task_id": 数字, "scheduled_date": "YYYY-MM-DD", "scheduled_time": "HH:MM 或 null", "reason": "简短解释"},
    ...
  ]
}

建议规则:
- 如果今天是休息日，建议不要安排新任务
- 如果是硬性截止日，优先提醒截止任务
- 上午安排需要专注的任务，下午安排较轻的任务
- 建议的 task_id 必须来自提供的 scheduled_tasks 或 pool_tasks"""


@router.post("/suggest-plan", response_model=SuggestPlanResponse)
def suggest_daily_plan(data: SuggestPlanRequest):
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API key not configured")

    user_msg = (
        f"日期: {data.date}\n"
        f"今日已安排任务:\n{data.scheduled_tasks_json}\n\n"
        f"任务池中的任务:\n{data.pool_tasks_json}\n\n"
        f"今日特殊日信息:\n{data.special_day_json}\n\n"
        f"请生成今日建议计划。"
    )

    try:
        result = _call_llm(PLAN_SYSTEM_PROMPT, user_msg)
        parsed = json.loads(result)
        return SuggestPlanResponse(**parsed)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Anomaly Detection
# ---------------------------------------------------------------------------
ANOMALY_SYSTEM_PROMPT = """你是一个个人习惯分析助手。分析用户的近期任务完成数据，检测以下异常模式:
1. 连续多天未完成某类任务（如连续3天没有运动）
2. 完成率突然下降（与之前相比）
3. 某类任务持续拖延（多次 migration）
4. 工作时间异常（过长或过短）
5. 任务积压（任务池持续增长）

返回严格的 JSON 格式:
{
  "anomalies": [
    {"type": "类型标签", "message": "人性化的提醒消息（中文）", "severity": "info/warning/alert"},
    ...
  ]
}

如果没有异常，返回 {"anomalies": []}。最多返回 3 条提醒。"""


@router.post("/check-anomalies", response_model=AnomalyCheckResponse)
def check_anomalies(data: AnomalyCheckRequest):
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API key not configured")

    try:
        result = _call_llm(ANOMALY_SYSTEM_PROMPT, data.recent_history_json)
        parsed = json.loads(result)
        return AnomalyCheckResponse(**parsed)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# AI Agent — function calling for direct calendar operations
# ---------------------------------------------------------------------------
from pydantic import BaseModel as PydanticBase

class AgentRequest(PydanticBase):
    text: str

@router.post("/agent")
def agent_endpoint(data: AgentRequest, db: Session = Depends(get_db)):
    """AI Agent: 自然语言 → function calling → 直接操作日历数据。"""
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API key not configured")

    from app.services.agent_service import run_agent
    result = run_agent(data.text, db)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result
