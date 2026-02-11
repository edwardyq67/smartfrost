import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";
import { getDictionary } from "@/app/dictionaries";

// ✅ CORREGIDO
const Layout = async ({ 
  children, 
  params  // ✅ No desestructurar aquí
}: { 
  children: React.ReactNode; 
  params: Promise<{ lang: any }>;  // ✅ params como Promise
}) => {
  // ✅ Await params antes de usar
  const { lang } = await params;
  const trans = await getDictionary(lang);

  return (
    <DashBoardLayoutProvider trans={trans}>{children}</DashBoardLayoutProvider>
  );
};

export default Layout;