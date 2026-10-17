/* All reports, zones, and model observations below are fictional.
 * No real incidents, coordinates, or personal information are included. */
(function (root) {
  'use strict';
  const zones = [
    { id: 'university', name: 'University Quarter', short: 'University', x: 178, y: 123, path: 'M58 46H296L274 210H49Z' },
    { id: 'market', name: 'Central Market', short: 'Market', x: 432, y: 128, path: 'M330 42H561L580 213H306Z' },
    { id: 'gardens', name: 'Garden District', short: 'Gardens', x: 166, y: 302, path: 'M48 240H275L264 384H53Z' },
    { id: 'station', name: 'Station Quarter', short: 'Station', x: 442, y: 306, path: 'M306 241H585L577 390H309Z' },
    { id: 'riverside', name: 'Riverside', short: 'Riverside', x: 166, y: 475, path: 'M56 415H266L293 557H67Z' },
    { id: 'oldtown', name: 'Old Town', short: 'Old Town', x: 435, y: 479, path: 'M309 422H577L561 557H335Z' }
  ];
  const categories = [
    { id: 'lighting', label: 'Street lighting', icon: 'sun', color: '#ba7139' },
    { id: 'transport', label: 'Public transport', icon: 'bus', color: '#42699a' },
    { id: 'access', label: 'Walkway access', icon: 'walk', color: '#677f47' },
    { id: 'concern', label: 'Public-space concern', icon: 'flag', color: '#886286' }
  ];
  const titles = {
    lighting: ['Dim lighting near the walkway', 'Streetlight needs attention', 'Uneven lighting at the crossing'],
    transport: ['Bus information board unavailable', 'Shelter lighting needs attention', 'Long wait at a transit stop'],
    access: ['Footpath obstructed in this area', 'Crossing access needs attention', 'Uneven surface on the walkway'],
    concern: ['Unwanted comments in a public space', 'Concern raised near a busy square', 'Community concern at a gathering space']
  };
  const descriptions = {
    lighting: 'Fictional example: a visitor reported patchy lighting along a general walking area. No exact location is recorded.',
    transport: 'Fictional example: a visitor noted a concern at a general transit area. This is a sample entry for the website demonstration.',
    access: 'Fictional example: an obstruction made a walking area difficult to use. The entry illustrates how access concerns can be organized.',
    concern: 'Fictional example: a visitor raised a public-space concern. This entry contains no real incident or identifying details.'
  };
  let seed = 48271;
  function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  const day = 86400000;
  const reports = Array.from({ length: 72 }, (_, i) => {
    const category = categories[Math.floor(random() * categories.length)].id;
    const zone = zones[Math.floor(random() * zones.length)].id;
    return {
      id: 'SR-' + String(i + 1).padStart(3, '0'), zone, category,
      date: new Date(Date.UTC(2026, 9, 16) - Math.floor(random() * 89) * day).toISOString().slice(0, 10),
      period: ['Morning', 'Afternoon', 'Evening', 'Night'][Math.floor(random() * 4)],
      title: titles[category][i % 3], description: descriptions[category], status: 'example', synthetic: true
    };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  // A separate synthetic time series, deliberately not totals of the 72 explorer examples.
  const weekly = [];
  zones.forEach((zone, z) => {
    let previous = 7 + z * 2;
    for (let week = 0; week < 52; week++) {
      const seasonal = 3 * Math.sin((2 * Math.PI * week) / 52 + z * .15);
      const noise = (random() - .5) * 7;
      const count = Math.max(0, Math.round(.32 * previous + .68 * (7 + z * 2 + week * .10 + seasonal) + noise));
      weekly.push({ area: zone.name, week: new Date(Date.UTC(2025, 9, 20) + week * 7 * day).toISOString().slice(0, 10), report_count: count });
      previous = count;
    }
  });
  const resources = [
    { id: 'erss', category: 'Emergency', title: 'Emergency assistance', provider: 'Emergency Response Support System', description: 'India’s 112 service connects people to emergency assistance. SafeRoute cannot receive emergency requests.', url: 'https://112.gov.in/', source: 'https://112.gov.in/about', icon: 'phone', phone: '112' },
    { id: 'ncw', category: 'Women’s support', title: 'Complaint guidance', provider: 'National Commission for Women', description: 'Read the Commission’s official complaint guidance and use its official portal for current options.', url: 'https://ncwapps.nic.in/onlinecomplaintsv2/frmFAQs.aspx', source: 'https://ncwapps.nic.in/onlinecomplaintsv2/frmFAQs.aspx', icon: 'shield' },
    { id: 'cyber', category: 'Online safety', title: 'Report cybercrime', provider: 'National Cyber Crime Reporting Portal', description: 'Access India’s official portal for cybercrime reporting, including matters affecting women and children.', url: 'https://cybercrime.gov.in/', source: 'https://www.mha.gov.in/en/divisionofmha/cyber-and-information-security-cis-division', icon: 'globe' },
    { id: 'sdg', category: 'Learn', title: 'Understand SDG 5', provider: 'United Nations', description: 'Explore the Gender Equality goal and its targets, including reducing violence and enabling technology for women’s empowerment.', url: 'https://sdgs.un.org/goals/goal5', source: 'https://sdgs.un.org/goals/goal5', icon: 'book' }
  ];
  const data = { zones, categories, reports, weekly, resources, referenceDate: '2026-10-16', resourcesChecked: '2026-10-17' };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.SafeRouteData = data;
})(typeof window !== 'undefined' ? window : globalThis);
