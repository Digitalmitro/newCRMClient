import { useAuth } from "../../context/authContext";

function Home() {
  const { userData } = useAuth();

  return (
    <div className="w-full px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="app-soft-panel rounded-[28px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
              Client Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Client overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              This workspace is focused on communication. Use the sidebar to open channels,
              continue direct conversations, and stay updated from the notification bell.
            </p>
          </div>
          <span className="app-stat-chip self-start rounded-full px-3 py-1 text-xs font-semibold">
            Welcome
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <section className="app-soft-panel rounded-[26px] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Welcome Message
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            Hello {userData?.name || "there"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Your client portal is designed to keep collaboration simple. You can join channel
            discussions, exchange direct messages with the team, review shared updates, and stay
            informed through the notification panel without navigating through internal admin tools.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            If you are waiting on a response, open the relevant channel from the sidebar or check
            your recent conversations under Messages. New alerts and task-related updates will also
            appear from the bell icon in the top bar.
          </p>
        </section>

        <aside className="app-soft-panel rounded-[26px] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Quick Guide
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Channels</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use channels for project or topic-based communication with the team.
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Messages</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open direct conversations from the middle sidebar when you need one-to-one discussion.
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The bell icon shows recent updates, mentions, and important alerts in one place.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Home;
