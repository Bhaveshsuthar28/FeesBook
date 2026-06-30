import Skeleton from "react-loading-skeleton";
import { FaBook } from "react-icons/fa";

export function RouteSkeleton() {
  return (
    <div
      className="
        mx-auto
        w-full
        max-w-6xl
        space-y-5
        p-5
      "
    >
      <Skeleton
        height={18}
        width={160}
      />
      <Skeleton
        height={34}
        width={260}
      />
      <StatsSkeleton />
      <TableSkeleton />
    </div>
  );
}

export function StatsSkeleton({
  count = 4,
}) {
  return (
    <div
      className="
        grid
        grid-cols-2
        gap-4
        lg:grid-cols-4
      "
    >
      {
        Array.from({
          length:
            count,
        }).map((_, index) => (
          <div
            key={index}
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
            "
          >
            <div
              className="
                flex
                items-start
                gap-4
              "
            >
              <Skeleton
                circle
                height={48}
                width={48}
              />
              <div
                className="
                  flex-1
                "
              >
                <Skeleton
                  height={12}
                  width="65%"
                />
                <Skeleton
                  className="mt-2"
                  height={28}
                  width="45%"
                />
                <Skeleton
                  className="mt-2"
                  height={12}
                  width="70%"
                />
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
      "
    >
      <div>
        <Skeleton
          height={28}
          width={180}
        />
        <Skeleton
          className="mt-2"
          height={14}
          width={260}
        />
      </div>
      <Skeleton
        height={44}
        width={130}
        borderRadius={12}
      />
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
}) {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
      "
    >
      <div
        className="
          border-b
          border-slate-100
          p-4
        "
      >
        <Skeleton
          height={42}
          width="100%"
        />
      </div>
      <div
        className="
          divide-y
          divide-slate-100
        "
      >
        {
          Array.from({
            length:
              rows,
          }).map((_, index) => (
            <div
              key={index}
              className="
                grid
                grid-cols-[40px_2fr_1fr_1fr_1fr]
                gap-4
                px-5
                py-4
              "
            >
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          ))
        }
      </div>
    </div>
  );
}

export function CardListSkeleton({
  rows = 4,
}) {
  return (
    <div
      className="
        space-y-3
      "
    >
      {
        Array.from({
          length:
            rows,
        }).map((_, index) => (
          <div
            key={index}
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <Skeleton
                circle
                height={42}
                width={42}
              />
              <div
                className="
                  flex-1
                "
              >
                <Skeleton
                  height={16}
                  width="70%"
                />
                <Skeleton
                  className="mt-2"
                  height={12}
                  width="45%"
                />
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div
      className="
        space-y-6
      "
    >
      <HeaderSkeleton />
      <StatsSkeleton />
      <TableSkeleton />
    </div>
  );
}

export function TableBodySkeleton({
  rows = 6,
  columns = 5,
}) {
  return (
    <>
      {
        Array.from({
          length: rows,
        }).map((_, rowIndex) => (
          <tr
            key={rowIndex}
            className="border-b border-slate-100 last:border-0"
          >
            {
              Array.from({
                length: columns,
              }).map((__, colIndex) => (
                <td
                  key={colIndex}
                  className="px-4 py-4"
                >
                  <Skeleton height={18} />
                </td>
              ))
            }
          </tr>
        ))
      }
    </>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 pb-24 lg:pb-0">
      <Skeleton height={16} width={140} />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton height={80} width={80} borderRadius={16} />
            <div className="flex-1">
              <Skeleton height={28} width={220} />
              <Skeleton className="mt-3" height={14} width={180} />
              <Skeleton className="mt-3" height={24} width={120} borderRadius={8} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton height={44} width={120} borderRadius={12} />
            <Skeleton height={44} width={140} borderRadius={12} />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-2">
        <div className="flex gap-2 p-2">
          <Skeleton height={40} width={100} borderRadius={10} />
          <Skeleton height={40} width={100} borderRadius={10} />
          <Skeleton height={40} width={100} borderRadius={10} />
          <Skeleton height={40} width={100} borderRadius={10} />
        </div>
        <div className="p-4">
          <StatsSkeleton count={3} />
          <div className="mt-4">
            <TableSkeleton rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 bg-slate-50/40 pb-8">
      <HeaderSkeleton />
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height={44} width={110} borderRadius={12} />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Skeleton height={24} width={200} />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>
        <Skeleton className="mt-6" height={120} />
      </div>
    </div>
  );
}

export function FeesPageSkeleton() {
  return (
    <div className="space-y-5">
      <HeaderSkeleton />
      <StatsSkeleton count={4} />
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <Skeleton height={42} width="100%" />
        <div className="mt-4 hidden md:block">
          <TableSkeleton rows={8} />
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          <CardListSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}

export function SectionGridSkeleton({
  count = 6,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {
        Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton circle height={48} width={48} />
              <Skeleton height={32} width={32} borderRadius={8} />
            </div>
            <Skeleton className="mt-4" height={22} width="55%" />
            <Skeleton className="mt-2" height={14} width="40%" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton height={52} borderRadius={12} />
              <Skeleton height={52} borderRadius={12} />
            </div>
          </div>
        ))
      }
    </div>
  );
}

export function FormPanelSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <Skeleton height={22} width={180} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} height={44} borderRadius={12} />
        ))}
      </div>
      <Skeleton className="mt-5" height={44} width={140} borderRadius={12} />
    </div>
  );
}

export function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Placeholder with FaBook icon */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
              <FaBook className="h-5 w-5 text-blue-600 animate-pulse" />
            </div>
            <div className="w-24 h-6 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <div className="w-16 h-4 bg-slate-100 rounded-md animate-pulse" />
            <div className="w-16 h-4 bg-slate-100 rounded-md animate-pulse" />
            <div className="w-16 h-4 bg-slate-100 rounded-md animate-pulse" />
            <div className="w-16 h-4 bg-slate-100 rounded-md animate-pulse" />
          </div>
          <div className="w-28 h-10 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </header>

      {/* Hero Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center">
        {/* Left Side */}
        <div className="space-y-6">
          <div className="w-48 h-8 bg-slate-100 rounded-full animate-pulse" />
          <div className="space-y-3">
            <div className="w-full max-w-lg h-12 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="w-3/4 max-w-sm h-12 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="w-full max-w-xl h-5 bg-slate-100 rounded-md animate-pulse" />
            <div className="w-5/6 max-w-lg h-5 bg-slate-100 rounded-md animate-pulse" />
            <div className="w-4/5 max-w-md h-5 bg-slate-100 rounded-md animate-pulse" />
          </div>
          <div className="flex gap-4 pt-4">
            <div className="w-36 h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="w-28 h-12 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full aspect-[4/3] bg-slate-100 rounded-3xl animate-pulse shadow-sm" />
      </div>
    </div>
  );
}
