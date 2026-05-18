import Skeleton from "react-loading-skeleton";

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
