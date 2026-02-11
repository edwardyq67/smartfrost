"use client";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermisosStore } from "@/store/permisos/permisosStore";
import { permisosService } from "@/lib/permisos/UsePermisos";
import { useModuleIconsStore } from "@/store/moduleIconsStore";
import { useRefreshDataPermisos } from "@/store/permisos/refreshDataPermisosStore";
import { useEffect, useState } from "react";

const countActivePermissions = (permisos: any[]) => {
  return permisos.filter(permiso => permiso.valor === 1).length;
};

const TopTen = () => {
  const {
    modulos,
    rolSeleccionado,
    setModulos,
    setModulosDesdeAPI,
    setNombreModuloSeleccionado,
    nombreModuloSeleccionado,
    setLoading
  } = usePermisosStore();

  const { refreshFlag } = useRefreshDataPermisos();
  const { getModuleIcon } = useModuleIconsStore();
  const [error, setError] = useState<string | null>(null);
  const [permisosActivosPorModulo, setPermisosActivosPorModulo] = useState<Record<string, number>>({});
  const [cargandoModulo, setCargandoModulo] = useState<string | null>(null);
  const [cargandoLista, setCargandoLista] = useState(false);

  // ✅ Obtener el UUID del rol seleccionado (maneja null y objeto)
  const rolUuid = rolSeleccionado?.uuid || null;

  useEffect(() => {
    const cargarPermisos = async () => {
      if (!rolUuid) return;

      setCargandoLista(true);
      setLoading(true);
      setError(null);

      try {
        const response = await permisosService.getPermisosPorRol({
          id_rol: rolUuid // ✅ Usar rolUuid directamente
        });

        if (response.data && response.data.length > 0) {
          const modulosFiltrados = response.data.filter(
            (modulo: any) => modulo.modulo.toLowerCase() !== "permisos"
          );

          setModulos(modulosFiltrados);

          const conteos: Record<string, number> = {};
          modulosFiltrados.forEach((modulo: any) => {
            conteos[modulo.modulo] = countActivePermissions(modulo.permisos || []);
          });
          setPermisosActivosPorModulo(conteos);
        } else {
          setError("No se encontraron permisos para este rol");
        }
      } catch (err) {
        setError('Error al cargar los permisos');
      } finally {
        setCargandoLista(false);
        setLoading(false);
      }
    };

    cargarPermisos();
  }, [rolUuid, setModulos, setLoading]); // ✅ Dependencia en rolUuid

  useEffect(() => {
    const actualizarModuloSeleccionado = async () => {
      if (!rolUuid || !nombreModuloSeleccionado) return;

      try {
        const response = await permisosService.getPermisosPorRolYModulo({
          id_rol: rolUuid, // ✅ Usar rolUuid
          modulo: nombreModuloSeleccionado
        });

        if (response.data && response.data[0]) {
          const moduloData = response.data[0];
          const moduloConPermisos = {
            modulo: nombreModuloSeleccionado,
            permisos: moduloData.permisos.map((permiso: any) => ({
              descripcion: permiso.descripcion,
              valor: permiso.valor,
              uuid_permiso: permiso.uuid_permiso,
              uuid_detalle: permiso.uuid_detalle
            }))
          };

          setModulosDesdeAPI(moduloConPermisos.permisos);

          const permisosActivos = countActivePermissions(moduloConPermisos.permisos);
          setPermisosActivosPorModulo(prev => ({
            ...prev,
            [nombreModuloSeleccionado]: permisosActivos
          }));
        }
      } catch (err) {
        // Silenciar error
      }
    };

    if (nombreModuloSeleccionado) {
      actualizarModuloSeleccionado();
    }
  }, [refreshFlag, rolUuid, nombreModuloSeleccionado, setModulosDesdeAPI]);

  const handleModuleClick = async (modulo: any) => {
    if (!rolUuid) return;

    setNombreModuloSeleccionado(modulo.modulo);
    setCargandoModulo(modulo.modulo);

    try {
      const response = await permisosService.getPermisosPorRolYModulo({
        id_rol: rolUuid, // ✅ Usar rolUuid
        modulo: modulo.modulo
      });

      if (response.data && response.data[0]) {
        const moduloData = response.data[0];
        const moduloConPermisos = {
          modulo: modulo.modulo,
          permisos: moduloData.permisos.map((permiso: any) => ({
            descripcion: permiso.descripcion,
            valor: permiso.valor,
            uuid_permiso: permiso.uuid_permiso,
            uuid_detalle: permiso.uuid_detalle
          }))
        };
        setModulosDesdeAPI(moduloConPermisos.permisos);

        const permisosActivos = countActivePermissions(moduloConPermisos.permisos);
        setPermisosActivosPorModulo(prev => ({
          ...prev,
          [modulo.modulo]: permisosActivos
        }));
      } else {
        setModulosDesdeAPI([]);
      }
    } catch (err) {
      setModulosDesdeAPI([]);
    } finally {
      setCargandoModulo(null);
    }
  };

  const renderContent = () => {
    if (cargandoLista) {
      return <div className="flex items-center justify-center h-32">
        <p className="text-sm text-default-500">Cargando módulos...</p>
      </div>;
    }

    if (error) {
      return <div className="flex items-center justify-center h-32">
        <p className="text-sm text-default-500">{error}</p>
      </div>;
    }

    if (!rolUuid) { // ✅ Cambiado de rolSeleccionado a rolUuid
      return <div className="flex items-center justify-center h-32">
        <p className="text-sm text-default-500">Selecciona un rol para ver los permisos</p>
      </div>;
    }

    if (!modulos || modulos.length === 0) {
      return <div className="flex items-center justify-center h-32">
        <p className="text-sm text-default-500">No se encontraron permisos para este rol</p>
      </div>;
    }

    return (
      <div className="h-full md:h-[77vh] overflow-y-auto pr-1">
        {modulos.map((modulo, index) => {
          const IconComponent = getModuleIcon(modulo.modulo);
          const permisosActivos = permisosActivosPorModulo[modulo.modulo] !== undefined
            ? permisosActivosPorModulo[modulo.modulo]
            : countActivePermissions(modulo.permisos || []);
          const totalPermisos = modulo.permisos?.length || 0;

          const isSelected = modulo.modulo === nombreModuloSeleccionado;
          const isLoading = modulo.modulo === cargandoModulo;

          return (
            <div
              className={`
                flex flex-wrap gap-2 py-[11px] px-4 cursor-pointer transition-colors relative
                ${isSelected
                  ? 'bg-primary bg-opacity-10 border-l-4 border-primary'
                  : 'hover:bg-default-50'
                }
                ${isLoading ? 'opacity-70' : ''}
              `}
              key={`module-item-${index}`}
              onClick={() => !isLoading && handleModuleClick(modulo)}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}

              <div className="flex-1 flex items-center gap-3">
                <div className={`
                  w-8 h-8 md:h-10 md:w-10 flex items-center justify-center rounded-full
                  ${isSelected
                    ? 'bg-primary bg-opacity-20'
                    : 'bg-primary bg-opacity-10'
                  }
                `}>
                  <IconComponent className={`w-4 h-4 md:w-5 md:h-5 ${isSelected ? 'text-primary' : 'text-primary'}`} />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium capitalize ${isSelected ? 'text-primary' : 'text-default-600'}`}>
                    {modulo.modulo.toLowerCase()}
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-primary/70' : 'text-default-400'}`}>
                    {permisosActivos} de {totalPermisos} permisos activos
                    {isLoading && <span className="ml-2 text-primary">Cargando...</span>}
                  </div>
                </div>
                <div className="flex items-center">
                  <Eye className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-primary'}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 overflow-hidden p-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default TopTen;