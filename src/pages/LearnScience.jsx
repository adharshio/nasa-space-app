const topics = [
  { title: 'Life Support Systems', text: 'Life support systems provide breathable air, safe water, food support, and stable habitat conditions. They integrate recycling, monitoring, and backups to keep crews alive in closed environments.' },
  { title: 'Oxygen Generation and Recycling', text: 'Habitats conserve oxygen by recycling carbon dioxide and recovering breathable gas. Recycling improves efficiency but cannot create unlimited oxygen without inputs and energy.' },
  { title: 'Water Recovery', text: 'Water recovery systems reclaim moisture from air and wastewater. Recovering a portion of used water reduces resupply needs, while leaks or failures can quickly create shortages.' },
  { title: 'Radiation Protection', text: 'Space radiation comes from solar events and galactic cosmic rays. Shielding, sheltering during storms, and limiting exposure time help reduce crew risk.' },
  { title: 'Solar Energy in Space', text: 'Solar panels convert sunlight into electricity. Output depends on sunlight availability, panel orientation/condition, dust, and system efficiency; batteries store excess energy for low-light periods.' },
  { title: 'Martian Dust Storms', text: 'Martian dust can reduce sunlight and coat solar panels, lowering power generation. Missions must conserve energy and maintain equipment during prolonged storms.' },
  { title: 'Space Habitat Temperature Regulation', text: 'External temperatures can be extreme. Heating and thermal control systems use energy to keep habitats within safe ranges for humans and equipment.' },
  { title: 'Food Production in Space', text: 'Greenhouses can supplement stored food, but they require water, power, light, and crew time. Balancing food production with other resource demands is a key trade-off.' },
]

export default function LearnScience() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <p className="text-cyan-300 uppercase tracking-wider text-sm">Education</p>
      <h1 className="text-3xl md:text-4xl font-bold text-white mt-1 mb-2">Learn Space Science</h1>
      <p className="text-slate-300 mb-8 max-w-3xl">Key concepts behind the ASTRA simulation. During emergencies, the dashboard also shows context-specific scientific explanations. All simulation values are illustrative for learning.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {topics.map((t) => (
          <div key={t.title} className="glass rounded-xl p-5">
            <h2 className="text-xl font-semibold text-white mb-2">{t.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 glass rounded-xl p-5 border border-cyan-400/20">
        <h2 className="text-xl font-semibold text-white mb-2">Science & Assumptions</h2>
        <ul className="text-sm text-slate-300 list-disc ml-5 space-y-2">
          <li>Resource values (e.g. 100 oxygen units, 200 L water) are simplified educational units, not real mission specifications.</li>
          <li>Recycling recovers a portion of daily use (efficiency-based) and does not create unlimited resources.</li>
          <li>Solar generation depends on sunlight and panel efficiency; dust/events can reduce output. Excess generation charges batteries; deficits drain batteries then reserves.</li>
          <li>Greenhouse food production consumes electricity and water while adding food.</li>
          <li>Heating and radiation shelter consume power but improve environmental safety; radiation/temperature affect system strain.</li>
        </ul>
      </div>
    </div>
  )
}
