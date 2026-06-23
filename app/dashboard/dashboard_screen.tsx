import ItemDetailed from "~/components/item-detailed";

interface DashboardScreenProps {
  propName: string;
}

export function DashboardScreen({ propName }: DashboardScreenProps) {
  return (
    <div>
      <nav className="flex w-full justify-between bg-amber-300 px-2 py-1 font-bitcount text-4xl leading-none font-semibold text-black">
        <div className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline">
          <p>DASHBOARD //</p>
        </div>
        <div className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline">
          <p>// LOGOUT</p>
        </div>
      </nav>
      <main>
        <ItemDetailed />
      </main>
    </div>
  );
}
