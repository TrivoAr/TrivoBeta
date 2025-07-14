import Skeleton from 'react-loading-skeleton';
import React from "react";

const MatchLoadingSkeleton = () => {
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Skeleton circle width={40} height={40} />
          <div>
            <Skeleton width={120} height={12} />
            <Skeleton width={100} height={12} />
          </div>
        </div>
        <Skeleton circle width={30} height={30} />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-4">
        <Skeleton width={90} height={30} borderRadius={8} />
        <Skeleton width={90} height={30} borderRadius={8} />
      </div>

      {/* Match salidas title */}
      <Skeleton width={150} height={24} className="mb-3" />

      {/* Cards */}
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide mb-6">
        {[1,2].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[260px] md:w-[310px] h-[220px] md:h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
          >
            <Skeleton height={100} mdHeight={115} />

            <div className="absolute top-[10px] left-[10px]">
              <Skeleton width={80} mdWidth={95} height={25} borderRadius={12} />
            </div>

            <div className="p-3 flex flex-col gap-2">
              <Skeleton width={`80%`} height={20} />
              <div className="flex items-center gap-1">
                <Skeleton circle width={13} height={13} />
                <Skeleton width={100} height={12} />
              </div>
              <Skeleton width={60} height={18} />
              <Skeleton width={80} height={12} />
            </div>

            <div className="absolute top-[38%] right-[10px] flex gap-2">
              <Skeleton circle width={40} height={40} />
            </div>
          </div>
        ))}
      </div>

      {/* Match social Team title */}
      <Skeleton width={160} height={24} className="mb-3" />

      {/* Texto final */}
      <Skeleton width={140} height={16} />
    </div>
  );
};

export default MatchLoadingSkeleton;
