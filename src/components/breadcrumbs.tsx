'use client';

import Link from 'next/link';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/motion/breadcrumb';

interface Crumb {
  href: string;
  label: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList maxItems={Infinity}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            // Stable route key per beUI convention: entering/leaving crumbs animate.
            <BreadcrumbItem key={item.href}>
              {index > 0 && <BreadcrumbSeparator className="mr-1" />}
              {isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={(props) => <Link href={item.href} {...props} />}
                >
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
