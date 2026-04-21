import pathlib

# Add monthly trends endpoint to analytics service
p = pathlib.Path('apps/backend/app/services/analytics_service.py')
src = p.read_text(encoding='utf-8')

addition = '''

async def get_monthly_trends(db: AsyncSession, district: Optional[str] = None) -> list:
    from app.models.incident import Incident
    results = []
    for i in range(5, -1, -1):
        from datetime import date
        import calendar
        today = datetime.now(timezone.utc)
        month_date = (today.replace(day=1) - timedelta(days=1)) if i == 0 else today
        # Calculate month i months ago
        month = (today.month - i - 1) % 12 + 1
        year = today.year - ((today.month - i - 1) // 12)
        month_start = datetime(year, month, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(year, month)[1]
        month_end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        
        q = select(func.count(Incident.id)).where(
            Incident.created_at >= month_start,
            Incident.created_at <= month_end
        )
        if district:
            q = q.where(Incident.district == district)
        total = (await db.execute(q)).scalar() or 0
        
        q2 = select(func.count(Incident.id)).where(
            Incident.created_at >= month_start,
            Incident.created_at <= month_end,
            Incident.golden_hour_met == True
        )
        if district:
            q2 = q2.where(Incident.district == district)
        golden = (await db.execute(q2)).scalar() or 0
        
        results.append({
            "month": month_start.strftime("%b"),
            "incidents": total,
            "golden_met": golden
        })
    return results
'''

src += addition
p.write_text(src, encoding='utf-8')
print('analytics_service.py updated')

# Add endpoint to analytics router
p2 = pathlib.Path('apps/backend/app/api/v1/analytics.py')
src2 = p2.read_text(encoding='utf-8')
src2 = src2.replace(
    'from app.services.analytics_service import get_kpi_summary, get_district_performance',
    'from app.services.analytics_service import get_kpi_summary, get_district_performance, get_monthly_trends'
)
src2 += '''

@router.get("/monthly-trends")
async def monthly_trends(
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_monthly_trends(db, district=district)
'''
p2.write_text(src2, encoding='utf-8')
print('analytics.py updated')
