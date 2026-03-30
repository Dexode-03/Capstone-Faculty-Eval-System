import { HiArrowRight } from 'react-icons/hi';

const Reports = () => {
  return (
    <div>
      <div className="mb-10">
        <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Analytics</p>
        <h1 className="text-3xl font-semibold text-psu-text tracking-tight">Reports</h1>
      </div>

      <div className="border border-psu-border bg-white">
        <div className="px-8 py-16 text-center max-w-md mx-auto">
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-4">Coming Soon</p>
          <h2 className="text-xl font-semibold text-psu-text tracking-tight">
            Evaluation reports are being developed
          </h2>
          <p className="text-[14px] text-psu-muted mt-3 leading-relaxed">
            Detailed reports with prescriptive analysis and improvement
            recommendations will be available in the next release.
          </p>
        </div>

        <div className="border-t border-psu-border grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-psu-border">
          {[
            { label: 'Analytics', desc: 'Performance trends and insights' },
            { label: 'Export', desc: 'Download reports as PDF' },
            { label: 'Recommendations', desc: 'AI-driven improvement suggestions' },
          ].map((item) => (
            <div key={item.label} className="px-6 py-5 group cursor-default">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[13px] font-medium text-psu-text">{item.label}</p>
                <HiArrowRight className="h-3 w-3 text-gray-300" />
              </div>
              <p className="text-[12px] text-psu-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
