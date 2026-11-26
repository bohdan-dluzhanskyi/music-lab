import type { NavigationItem } from '@/app/navigation';

interface WorkspacePageProps {
  item: NavigationItem;
}

export default function WorkspacePage({ item }: WorkspacePageProps) {
  const Icon = item.icon;

  return (
    <section className="workspace-page">
      <Icon size={40} strokeWidth={1.2} />

      <h1>{item.label}</h1>

      <p>{item.description}</p>

      <span>Module under development</span>
    </section>
  );
}
