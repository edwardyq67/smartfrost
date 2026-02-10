import { Suspense } from "react";
import { getDictionary } from "@/app/dictionaries";
import DashboardLoading from "../../loading";

interface DashboardProps {
  params: Promise<{
    lang: any;
  }>;
}

// ✅ Componente que maneja la carga de datos
async function DashboardContent({ lang }: { lang: any }) {
  const trans = await getDictionary(lang);
  
  // ✅ Carga diferida del componente pesado
  const DashboardPageView = (await import("./page-view")).default;
  
  return <DashboardPageView trans={trans} />;
}

const Dashboard = async (props: DashboardProps) => {
  const params = await props.params;
  const lang = params.lang;
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent lang={lang} />
    </Suspense>
  );
};

export default Dashboard;