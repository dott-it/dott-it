import Link from "next/link"

export interface NavItem {
  href: string
  label: string
}

interface MainNavProps {
  items: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  return (
    <nav className="hidden gap-6 text-sm font-medium md:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-muted-foreground hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
