"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiGetResources, type ResourceItem } from "@/lib/api/resources";
import {
  type ResourceType,
  type Pricing,
  RESOURCE_TYPES,
  PRICING_VALUES,
} from "@repo/types";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const types = Object.values(RESOURCE_TYPES);
const pricing = Object.values(PRICING_VALUES);

export default function AdminResourcesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pricingFilter, setPricingFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/");
    }
  }, [user, router]);

  const queryParams: Record<string, string> = {
    page: String(page),
    limit: "20",
    ...(search && { search }),
    ...(typeFilter && { type: typeFilter }),
    ...(pricingFilter && { pricing: pricingFilter }),
  };

  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ["admin-resources", queryParams],
    queryFn: () => apiGetResources(queryParams),
    enabled: user?.role === "ADMIN",
  });

  const resources = resourcesData?.data || [];
  const totalPages = resourcesData?.meta?.totalPages ?? 1;

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">
            {t("admin.resources.management")}
          </h1>
          <p className="text-text-secondary mt-1">
            {t("admin.resources.managementDesc")}
          </p>
        </div>
      </div>

      <Card className="mb-6 border border-border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="text"
              placeholder={t("admin.resources.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <Select
              value={typeFilter}
              onValueChange={(val) => {
                setTypeFilter(val === "all" ? "" : val || "");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px] h-10">
                <SelectValue placeholder={t("resources.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("resources.allTypes")}</SelectItem>
                {types.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`resources.types.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={pricingFilter}
              onValueChange={(val) => {
                setPricingFilter(val === "all" ? "" : val || "");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px] h-10">
                <SelectValue placeholder={t("resources.allPricing")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("resources.allPricing")}</SelectItem>
                {pricing.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`resources.pricing.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 bg-bg-hover rounded w-1/4"></div>
                <div className="h-4 bg-bg-hover rounded w-1/4"></div>
                <div className="h-6 bg-bg-hover rounded-full w-20"></div>
                <div className="h-6 bg-bg-hover rounded-full w-20"></div>
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <p>{t("resources.noResources")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light max-h-[600px] overflow-y-auto">
            {resources.map((r) => (
              <Link
                key={r._id}
                href={`/admin/resources/${r._id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-bg-hover transition-colors gap-4"
              >
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-semibold text-text truncate">
                    {r.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted truncate">
                    <span>
                      {r.url.replace(/^https?:\/\//, "").split("/")[0]}
                    </span>
                    <span>•</span>
                    <span className="uppercase">{r.language}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {r.quality?.normalizationStatus && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${r.quality.normalizationStatus === "COMPLETED" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                    >
                      {r.quality.normalizationStatus}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-white">
                    {t(`resources.types.${r.type}`)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {t(`resources.pricing.${r.pricing}`)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {t("resources.previous")}
          </Button>
          <span className="text-sm font-medium text-text-secondary">
            {t("resources.page")} {page} {t("resources.of")} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t("resources.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
