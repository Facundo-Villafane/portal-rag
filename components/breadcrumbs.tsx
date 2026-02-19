import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
    label: string
    href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className='flex items-center gap-1 text-sm text-slate-500 mb-6'>
            {items.map((item, index) => {
                const isLast = index === items.length - 1
                return (
                    <span key={index} className='flex items-center gap-1'>
                        {index > 0 && <ChevronRight className='w-3.5 h-3.5 text-slate-400 flex-shrink-0' />}
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className='hover:text-slate-900 transition-colors truncate max-w-[160px]'
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? 'text-slate-900 font-medium truncate max-w-[200px]' : 'truncate max-w-[160px]'}>
                                {item.label}
                            </span>
                        )}
                    </span>
                )
            })}
        </nav>
    )
}
