export default function SiteList({ sites, scenario }) {
  if (!scenario) return null;

  const openIds = new Set(scenario.open_site_ids);
  const openSites = sites
    .filter(s => openIds.has(s.site_id))
    .sort((a, b) => (a.is_existing ? 1 : 0) - (b.is_existing ? 1 : 0));

  return (
    <div className="bg-[#f5faf7] rounded-xl border border-[#c8e3d8] p-6">
      <h3 className="text-lg font-semibold text-[#171717] mb-1">Selected Sites</h3>
      <p className="text-xs text-[#54494B] mb-4">{openSites.length} centers ({openSites.filter(s => s.is_existing).length} existing + {openSites.filter(s => !s.is_existing).length} new)</p>

      <div className="max-h-[360px] overflow-y-auto space-y-1.5">
        {openSites.map(site => (
          <div
            key={site.site_id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#d4ebe1]/40 transition-colors group"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: site.is_existing ? '#2563eb' : '#B33951' }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#171717] truncate">
                {site.site_name}
              </p>
              <p className="text-xs text-gray-400">{site.type}</p>
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full
              ${site.is_existing
                ? 'bg-blue-50 text-blue-600'
                : 'bg-red-50 text-[#B33951]'}`}
            >
              {site.is_existing ? 'Existing' : 'New'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
