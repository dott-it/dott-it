"use client"
import React, { ReactNode } from "react";
import { Breadcrumb } from "../breadcrumb";
import { getBreadcrumbs } from "@/lib/get-breadcrumbs";
import { usePathname } from "next/navigation";

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string;
  badge?: ReactNode;
}
export function PageHeader({
  title,
  subtitle,
  badge,
}: PageHeaderProps): ReactNode {
  const pathname= usePathname();

  const breadcrumbs = getBreadcrumbs(pathname ?? '' );

  return (
    <div className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb breadcrumbs={breadcrumbs} />
      )}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {badge && (
          <div className="flex items-center space-x-2">
            {badge}
          </div>
        )}
      </div>
    </div>
  )
}
