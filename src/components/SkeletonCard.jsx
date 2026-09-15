export default function SkeletonCard() {
  return (
    <div className="bg-[#fdfbf3] rounded-xl p-5 border border-[#e8ddb8]">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-7 w-24 rounded" />
    </div>
  );
}

export function SkeletonMap() {
  return (
    <div className="skeleton rounded-xl" style={{ height: '520px' }} />
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-[#f5faf7] rounded-xl border border-[#c8e3d8] p-6">
      <div className="skeleton h-4 w-40 rounded mb-4" />
      <div className="skeleton rounded" style={{ height: '300px' }} />
    </div>
  );
}
