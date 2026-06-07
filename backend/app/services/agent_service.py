"""AI Agent service — LLM uses function calling to directly operate on calendar data."""

import json
from datetime import date, time, datetime
from typing import Optional
from sqlalchemy.orm import Session
from openai import OpenAI

from app.config import settings
from app.models.task import Task
from app.models.category import Category
from app.models.special_day import SpecialDay
from app.models.migration_log import MigrationLog

# ── Tool definitions for DeepSeek function calling ──────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "列出任务。可按日期范围、状态、优先级、池状态筛选。",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "开始日期 YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "结束日期 YYYY-MM-DD"},
                    "status": {"type": "string", "enum": ["pending", "in_progress", "completed"]},
                    "priority": {"type": "string", "enum": ["P0", "P1", "P2", "P3"]},
                    "pool_only": {"type": "boolean", "description": "仅看任务池中的任务"},
                    "search": {"type": "string", "description": "标题搜索关键词"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "创建一个新任务。如果不指定 scheduled_date，任务会放在任务池中。",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "任务标题"},
                    "description": {"type": "string", "description": "任务描述"},
                    "estimated_minutes": {"type": "integer", "description": "预估耗时（分钟）"},
                    "priority": {"type": "string", "enum": ["P0", "P1", "P2", "P3"], "description": "优先级"},
                    "hard_deadline": {"type": "string", "description": "硬性截止日期 YYYY-MM-DD"},
                    "scheduled_date": {"type": "string", "description": "安排到哪一天 YYYY-MM-DD，空则放任务池"},
                    "scheduled_time": {"type": "string", "description": "具体时间 HH:MM"},
                    "category_names": {"type": "array", "items": {"type": "string"}, "description": "分类名称列表，如 ['学习', '工作']"},
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "更新任务的属性（标题、优先级、状态等）。",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "任务ID"},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "estimated_minutes": {"type": "integer"},
                    "priority": {"type": "string", "enum": ["P0", "P1", "P2", "P3"]},
                    "status": {"type": "string", "enum": ["pending", "in_progress", "completed"]},
                    "is_completed": {"type": "boolean", "description": "标记完成/取消完成"},
                    "completion_pct": {"type": "integer", "description": "完成百分比 0-100"},
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "删除一个任务。",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "任务ID"},
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_task",
            "description": "将任务安排到某一天（或取消安排放回任务池）。",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "任务ID"},
                    "scheduled_date": {"type": "string", "description": "日期 YYYY-MM-DD，传 null 则放回任务池"},
                    "scheduled_time": {"type": "string", "description": "可选时间 HH:MM"},
                },
                "required": ["task_id", "scheduled_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_categories",
            "description": "列出所有可用的分类标签。",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_special_day",
            "description": "将某个日期标记为特殊日（截止日、里程碑、休息日等）。",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "日期 YYYY-MM-DD"},
                    "type": {"type": "string", "enum": ["hard_deadline", "milestone", "rest_day", "custom"]},
                    "label": {"type": "string", "description": "标签文字"},
                    "color": {"type": "string", "description": "颜色 hex，如 #ef4444"},
                    "icon": {"type": "string", "description": "emoji 图标，如 📝"},
                },
                "required": ["date", "type", "label"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_special_days",
            "description": "列出指定日期范围内的所有特殊日标记。",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "开始日期 YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "结束日期 YYYY-MM-DD"},
                },
                "required": ["start_date", "end_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_special_day",
            "description": "删除一个特殊日标记。可以通过 special_day_id 或 date 来定位。如果不知道ID，先用 list_special_days 查询。",
            "parameters": {
                "type": "object",
                "properties": {
                    "special_day_id": {"type": "integer", "description": "特殊日ID（优先使用）"},
                    "date": {"type": "string", "description": "或者通过日期来删除 YYYY-MM-DD"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_dashboard_summary",
            "description": "获取当前周/月的完成率统计概览。",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


# ── Tool execution ──────────────────────────────────────────────────────

def _execute_tool(name: str, args: dict, db: Session) -> str:
    """Execute a tool function and return the result as a JSON string."""
    try:
        if name == "list_tasks":
            return _list_tasks(db, args)
        elif name == "create_task":
            return _create_task(db, args)
        elif name == "update_task":
            return _update_task(db, args)
        elif name == "delete_task":
            return _delete_task(db, args)
        elif name == "schedule_task":
            return _schedule_task(db, args)
        elif name == "list_categories":
            return _list_categories(db)
        elif name == "list_special_days":
            return _list_special_days(db, args)
        elif name == "create_special_day":
            return _create_special_day(db, args)
        elif name == "delete_special_day":
            return _delete_special_day(db, args)
        elif name == "get_dashboard_summary":
            return _get_summary(db)
        else:
            return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})


def _list_tasks(db: Session, args: dict) -> str:
    query = db.query(Task)
    if args.get("start_date") and args.get("end_date"):
        query = query.filter(Task.scheduled_date.between(args["start_date"], args["end_date"]))
    if args.get("status"):
        query = query.filter(Task.status == args["status"])
    if args.get("priority"):
        query = query.filter(Task.priority == args["priority"])
    if args.get("pool_only"):
        from sqlalchemy import or_
        query = query.filter(or_(Task.pool_only == True, Task.scheduled_date == None))
    if args.get("search"):
        query = query.filter(Task.title.ilike(f"%{args['search']}%"))

    tasks = query.order_by(Task.priority, Task.created_at.desc()).limit(50).all()
    result = []
    for t in tasks:
        result.append({
            "id": t.id,
            "title": t.title,
            "priority": t.priority,
            "status": t.status,
            "is_completed": t.is_completed,
            "completion_pct": t.completion_pct,
            "scheduled_date": t.scheduled_date.isoformat() if t.scheduled_date else None,
            "scheduled_time": str(t.scheduled_time)[:5] if t.scheduled_time else None,
            "estimated_minutes": t.estimated_minutes,
            "actual_minutes": t.actual_minutes,
            "migration_count": t.migration_count or 0,
            "categories": [c.name for c in t.categories],
        })
    return json.dumps({"tasks": result, "count": len(result)}, ensure_ascii=False)


def _create_task(db: Session, args: dict) -> str:
    cat_names = args.get("category_names", [])
    categories = []
    if cat_names:
        categories = db.query(Category).filter(Category.name.in_(cat_names)).all()
        # Create missing categories
        existing_names = {c.name for c in categories}
        for name in cat_names:
            if name not in existing_names:
                cat = Category(name=name, color="#6366f1")
                db.add(cat)
                db.flush()
                categories.append(cat)

    task = Task(
        title=args["title"],
        description=args.get("description", ""),
        estimated_minutes=args.get("estimated_minutes", 0),
        priority=args.get("priority", "P2"),
        hard_deadline=date.fromisoformat(args["hard_deadline"]) if args.get("hard_deadline") else None,
        scheduled_date=date.fromisoformat(args["scheduled_date"]) if args.get("scheduled_date") else None,
        scheduled_time=time.fromisoformat(args["scheduled_time"]) if args.get("scheduled_time") else None,
        pool_only=args.get("scheduled_date") is None,
        categories=categories,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return json.dumps({"created": True, "task_id": task.id, "title": task.title}, ensure_ascii=False)


def _update_task(db: Session, args: dict) -> str:
    task_id = args["task_id"]
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})

    for field in ["title", "description", "estimated_minutes", "priority", "status"]:
        if field in args:
            setattr(task, field, args[field])
    if "is_completed" in args:
        task.is_completed = args["is_completed"]
        if args["is_completed"]:
            task.completion_pct = 100
            task.status = "completed"
    if "completion_pct" in args:
        task.completion_pct = args["completion_pct"]
        if args["completion_pct"] >= 100:
            task.is_completed = True
            task.status = "completed"

    db.commit()
    return json.dumps({"updated": True, "task_id": task.id, "title": task.title}, ensure_ascii=False)


def _delete_task(db: Session, args: dict) -> str:
    task = db.query(Task).filter(Task.id == args["task_id"]).first()
    if not task:
        return json.dumps({"error": f"Task {args['task_id']} not found"})
    title = task.title
    db.delete(task)
    db.commit()
    return json.dumps({"deleted": True, "task_id": args["task_id"], "title": title}, ensure_ascii=False)


def _schedule_task(db: Session, args: dict) -> str:
    task = db.query(Task).filter(Task.id == args["task_id"]).first()
    if not task:
        return json.dumps({"error": f"Task {args['task_id']} not found"})

    sched_date = args.get("scheduled_date")
    task.scheduled_date = date.fromisoformat(sched_date) if sched_date else None
    task.scheduled_time = time.fromisoformat(args["scheduled_time"]) if args.get("scheduled_time") else None
    task.pool_only = sched_date is None
    db.commit()
    return json.dumps({
        "scheduled": True,
        "task_id": task.id,
        "title": task.title,
        "date": sched_date or "放回任务池",
    }, ensure_ascii=False)


def _list_categories(db: Session) -> str:
    cats = db.query(Category).all()
    return json.dumps({"categories": [{"id": c.id, "name": c.name, "color": c.color} for c in cats]}, ensure_ascii=False)


def _list_special_days(db: Session, args: dict) -> str:
    sds = db.query(SpecialDay).filter(
        SpecialDay.date.between(args["start_date"], args["end_date"])
    ).all()
    result = [{
        "id": s.id, "date": s.date.isoformat(), "type": s.type,
        "label": s.label, "color": s.color, "icon": s.icon,
    } for s in sds]
    return json.dumps({"special_days": result, "count": len(result)}, ensure_ascii=False)


def _create_special_day(db: Session, args: dict) -> str:
    existing = db.query(SpecialDay).filter(SpecialDay.date == args["date"]).first()
    if existing:
        existing.type = args.get("type", existing.type)
        existing.label = args.get("label", existing.label)
        existing.color = args.get("color", existing.color)
        existing.icon = args.get("icon", existing.icon)
        db.commit()
        return json.dumps({"updated": True, "special_day_id": existing.id, "label": existing.label}, ensure_ascii=False)

    sd = SpecialDay(
        date=date.fromisoformat(args["date"]),
        type=args["type"],
        label=args["label"],
        color=args.get("color", "#ef4444"),
        icon=args.get("icon", ""),
    )
    db.add(sd)
    db.commit()
    db.refresh(sd)
    return json.dumps({"created": True, "special_day_id": sd.id, "label": sd.label}, ensure_ascii=False)


def _delete_special_day(db: Session, args: dict) -> str:
    sd = None
    if args.get("special_day_id"):
        sd = db.query(SpecialDay).filter(SpecialDay.id == args["special_day_id"]).first()
    elif args.get("date"):
        sd = db.query(SpecialDay).filter(SpecialDay.date == args["date"]).first()

    if not sd:
        lookup = args.get("special_day_id") or args.get("date")
        return json.dumps({"error": f"Special day not found: {lookup}. Use list_special_days first to find it."}, ensure_ascii=False)

    label = sd.label
    date_str = sd.date.isoformat()
    db.delete(sd)
    db.commit()
    return json.dumps({"deleted": True, "label": label, "date": date_str}, ensure_ascii=False)


def _get_summary(db: Session) -> str:
    today = date.today()
    monday = today - __import__('datetime').timedelta(days=today.weekday())
    sunday = monday + __import__('datetime').timedelta(days=6)
    month_start = today.replace(day=1)

    week_tasks = db.query(Task).filter(Task.scheduled_date.between(monday, sunday)).all()
    month_tasks = db.query(Task).filter(Task.scheduled_date >= month_start).all()

    w_total = len(week_tasks)
    w_done = sum(1 for t in week_tasks if t.is_completed)
    m_total = len(month_tasks)
    m_done = sum(1 for t in month_tasks if t.is_completed)

    return json.dumps({
        "weekly_completion_rate": round(w_done / w_total * 100, 1) if w_total > 0 else 0,
        "monthly_completion_rate": round(m_done / m_total * 100, 1) if m_total > 0 else 0,
        "week_tasks_total": w_total,
        "week_tasks_done": w_done,
        "month_tasks_total": m_total,
        "month_tasks_done": m_done,
        "today": today.isoformat(),
    }, ensure_ascii=False)


# ── Agent loop ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """你是一个日历管理助手。你可以直接操作用户的日历数据来完成任务。

规则：
1. 理解用户的意图，选择合适的工具来执行操作
2. 可以先查询再操作（比如先 list_tasks 找到任务ID，再 update_task）
3. 对于模糊的指令，尽量做出合理的推断并执行
4. 每次操作后，用简洁的中文告诉用户你做了什么
5. 创建任务时，如果用户没有指定日期，默认放到任务池
6. 如果你的操作涉及删除，要先说明一下（但不需要等待确认）

今天的日期：{today}
"""


def run_agent(user_input: str, db: Session) -> dict:
    """Run the AI agent: call LLM with tools, execute tool calls, return results."""
    if not settings.DEEPSEEK_API_KEY:
        return {"error": "DeepSeek API key not configured", "actions": []}

    client = OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )

    today = date.today().isoformat()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(today=today)},
        {"role": "user", "content": user_input},
    ]

    actions = []
    max_rounds = 5

    for _ in range(max_rounds):
        response = client.chat.completions.create(
            model=settings.DEEPSEEK_MODEL,
            messages=messages,
            tools=TOOLS,
            temperature=0.3,
        )

        msg = response.choices[0].message

        # If no tool calls, we're done — return the text response
        if not msg.tool_calls:
            messages.append({"role": "assistant", "content": msg.content or ""})
            break

        # Append assistant message with tool calls
        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in msg.tool_calls
            ],
        })

        for tc in msg.tool_calls:
            func_name = tc.function.name
            func_args = json.loads(tc.function.arguments)
            result = _execute_tool(func_name, func_args, db)
            actions.append({
                "tool": func_name,
                "args": func_args,
                "result": json.loads(result) if result else {},
            })
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })

    # Get final response
    final_response = client.chat.completions.create(
        model=settings.DEEPSEEK_MODEL,
        messages=messages,
        temperature=0.3,
    )
    final_text = final_response.choices[0].message.content or ""

    return {
        "message": final_text,
        "actions": actions,
    }
