import {pages} from "@/lib/pages";

export function getBreadcrumbs(pathname: string) {
    const breadcrumbs = [];

    // Always start with home/dashboard
    breadcrumbs.push({ label: "Home", href: "/dashboard" });

    for (const group of pages) {
        // Find the item the path matches
        const page = group.items.find(item => pathname.startsWith(item.href));

        if (page) {
            // Add group, **unless** it's the Core Operations group
            if (group.title !== "Core Operations") {
                breadcrumbs.push({
                    label: group.title,
                    href: group.items[0].href.split("/")[1]
                        ? `/${group.items[0].href.split("/")[1]}`
                        : group.items[0].href
                });
            }

            // Add the actual page
            breadcrumbs.push({ label: page.title, href: page.href });
            break;
        }
    }

    // Handle dynamic segments (e.g. /store/products/123)
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length > 2) {
        breadcrumbs.push({
            label: formatDynamicLabel(parts[parts.length - 1]),
            href: pathname
        });
    }

    return breadcrumbs;
}


function formatDynamicLabel(segment: string) {
    // Convert 'edit' -> 'Edit', '123' -> 'Detail', etc.
    if (segment === 'edit') return 'Edit';
    if (segment === 'new') return 'New';
    if (!isNaN(Number(segment))) return 'Detail';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
}