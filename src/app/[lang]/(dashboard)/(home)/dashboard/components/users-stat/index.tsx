"use client";
import { Building, TrendingUp, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { EmpresaService, Empresa, EmpresasResponse } from "@/lib/empresas/UseEmpresas";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard/dataDashboard";

interface EmpresaStat {
  uuid: string;
  nombre: string;
  dispositivosCount: number;
  seleccionada?: boolean;
}

const UsersStat = () => {
  const [empresas, setEmpresas] = useState<EmpresaStat[]>([]);
  const [totalDispositivos, setTotalDispositivos] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [empresasCount, setEmpresasCount] = useState<number>(0);

  // Usar el store del dashboard - ahora solo una empresa
  const {
    empresa: empresaStore,
    setEmpresa,
    setLoadingEmpresa,
    setErrorEmpresa
  } = useDashboardStore();

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true);
        setLoadingEmpresa(true);

        // Obtener todas las empresas
        const response: EmpresasResponse = await EmpresaService.getEmpresas({
          page: 1,
          size: 10 // Limitar a 10 empresas para el dashboard
        });

        if (response.status === 200) {
          const empresasData = response.data.data;
          setEmpresasCount(response.data.pager?.totalItems || empresasData.length);

          // Para cada empresa, obtener su resumen para contar dispositivos
          const empresasConDispositivos = await Promise.all(
            empresasData.map(async (empresa: Empresa) => {
              try {
                const resumen = await EmpresaService.getEmpresaResumen(empresa.uuid);
                if (resumen.status === 200) {
                  const totales = resumen.data.totales;
                  const totalDispositivos =  totales.qty_sensor ;

                  const empresaStat = {
                    uuid: empresa.uuid,
                    nombre: empresa.nombre,
                    dispositivosCount: totalDispositivos,
                    seleccionada: empresa.uuid === empresaStore?.uuid
                  };

                  return empresaStat;
                }
                return {
                  uuid: empresa.uuid,
                  nombre: empresa.nombre,
                  dispositivosCount: 0,
                  seleccionada: empresa.uuid === empresaStore?.uuid
                };
              } catch (error) {
                console.error(`Error obteniendo resumen de empresa ${empresa.nombre}:`, error);
                return {
                  uuid: empresa.uuid,
                  nombre: empresa.nombre,
                  dispositivosCount: 0,
                  seleccionada: empresa.uuid === empresaStore?.uuid
                };
              }
            })
          );

          // Si no hay empresa en el store, marcar la primera como seleccionada
          if (!empresaStore && empresasConDispositivos.length > 0) {
            empresasConDispositivos[0].seleccionada = true;
            setEmpresa({
              uuid: empresasConDispositivos[0].uuid,
              nombre: empresasConDispositivos[0].nombre
            });
          }

          setEmpresas(empresasConDispositivos);

          // Calcular total de dispositivos sumando todos
          const total = empresasConDispositivos.reduce((sum, empresa) => sum + empresa.dispositivosCount, 0);
          setTotalDispositivos(total);
        }
      } catch (err) {
        console.error("Error fetching empresas:", err);
        setErrorEmpresa("Error al cargar empresas");
        // Si hay error, establecer arrays vacíos
        setEmpresas([]);
        setEmpresasCount(0);
        setTotalDispositivos(0);
      } finally {
        setLoading(false);
        setLoadingEmpresa(false);
      }
    };

    fetchEmpresas();
  }, [setEmpresa, setLoadingEmpresa, setErrorEmpresa]);

  // Función para manejar la selección de una empresa
  const handleSelectEmpresa = (empresa: EmpresaStat) => {
    // Deseleccionar todas las empresas
    const empresasActualizadas = empresas.map(e => ({
      ...e,
      seleccionada: e.uuid === empresa.uuid
    }));

    setEmpresas(empresasActualizadas);

    // Guardar la empresa seleccionada en el store
    setEmpresa({
      uuid: empresa.uuid,
      nombre: empresa.nombre
    });
  };

  const tieneDatos = empresas.length > 0 && totalDispositivos > 0;

  return (
    <div className="bg-white overscroll-y-auto dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Empresas
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? "..." : totalDispositivos}
            </span>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Building className="h-4 w-4" />
          <span>
            {loading ? "Cargando..." : `${empresasCount} empresas registradas`}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Dispositivos por empresa
        </p>

        {!loading && !tieneDatos ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="h-16 w-16 mx-auto mb-3 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <Building className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-medium">No hay datos disponibles</p>
            <p className="text-sm mt-1">No se encontraron empresas con dispositivos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              // Lista de empresas
              empresas.slice(0, 4).map((empresa) => {
                const estaSeleccionada = empresa.uuid === empresaStore?.uuid;

                return (
                  <div
                    key={empresa.uuid}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer",
                      "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      "border",
                      estaSeleccionada
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-100 dark:border-gray-700"
                    )}
                    onClick={() => handleSelectEmpresa(empresa)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          estaSeleccionada
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-gray-100 dark:bg-gray-700"
                        )}>
                          <Building className={cn(
                            "h-5 w-5",
                            estaSeleccionada
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          )} />
                        </div>
                        {estaSeleccionada && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-medium",
                          estaSeleccionada
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-800 dark:text-white"
                        )}>
                          {empresa.nombre}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {empresa.dispositivosCount} dispositivo{empresa.dispositivosCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-lg font-semibold",
                        estaSeleccionada
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300"
                      )}>
                        {empresa.dispositivosCount}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersStat;