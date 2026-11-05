import { EmptyState } from "@/components/backoffice/common/empty-state";
import { LoadingState } from "@/components/backoffice/common/loading-state";
import { Users } from "lucide-react";
import { JSX } from "react";
import { tenantQueries } from '@/app/lib/services/tenants/tenant.queries'
import { TenantCard } from "@/components/backoffice/tenants/tenant-card";

export default function TenantsListComponent() : JSX.Element {
 const {
    data: tenants,
    isLoading: tenantsLoading,
    error: tenantsError,
  } = tenantQueries.list.useQuery()
    
    if (tenantsLoading) return <LoadingState />
    if (tenantsError) {
      return (
        <EmptyState
          icon={Users}
          title="Error loading tenants"
          description="There was an error loading tenants. Please try again."
        />
      )
    }
    if (tenants && tenants.length > 0) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )
    }
    return (
      <EmptyState
        icon={Users}
        title="No tenants found"
        description="No tenants are available in the system."
        actionLabel="Create your first tenant"
        actionHref="/backoffice/tenants/create"
      />
    )


}