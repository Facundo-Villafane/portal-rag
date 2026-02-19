import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs'

interface PageHeaderProps {
    title: string
    description?: string
    breadcrumbs?: BreadcrumbItem[]
    action?: React.ReactNode
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
    return (
        <div className='mb-8'>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs items={breadcrumbs} />
            )}
            <div className='flex items-start justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>{title}</h1>
                    {description && (
                        <p className='text-slate-500 mt-1 text-sm'>{description}</p>
                    )}
                </div>
                {action && (
                    <div className='flex-shrink-0'>{action}</div>
                )}
            </div>
        </div>
    )
}
