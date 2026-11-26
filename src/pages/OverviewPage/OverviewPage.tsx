import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { navigation } from '@/app/navigation';
import FrequencyConverter from '@/features/frequency/FrequencyConverter';

import './OverviewPage.scss';

export default function OverviewPage() {
  const laboratory = navigation.find((group) => group.title === 'Laboratory');

  return (
    <div className="overview">
      <div className="overview__heading">
        <span>Workspace</span>
        <h1>Overview</h1>
        <p>Explore the relationship between music and mathematics.</p>
      </div>

      <FrequencyConverter />

      <section className="overview__section">
        <h2>Laboratory</h2>

        <div className="overview__tools">
          {laboratory?.items.map(({ label, path, icon: Icon, description }) => (
            <Link to={path} className="overview__tool" key={path}>
              <div className="overview__tool-top">
                <Icon size={22} strokeWidth={1.5} />
                <ArrowUpRight size={16} />
              </div>

              <h3>{label}</h3>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
