"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNotificacionesStore } from "@/store/notificaciones/notificacionesStores";
import { useState, useCallback, memo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface Usuario {
  uuid: string;
  nombre: string;
}

interface BasicComboboxProps {
  usuarios: Usuario[];
}

// Componente memoizado para elementos de usuario
const UsuarioItem = memo(({ 
  usuario, 
  isSelected, 
  onSelect 
}: { 
  usuario: Usuario; 
  isSelected: boolean; 
  onSelect: (uuid: string) => void; 
}) => (
  <CommandItem
    value={usuario.uuid}
    onSelect={() => onSelect(usuario.uuid)}
  >
    <Check
      className={cn(
        "mr-2 h-4 w-4",
        isSelected ? "opacity-100" : "opacity-0"
      )}
    />
    {usuario.nombre}
  </CommandItem>
));

UsuarioItem.displayName = 'UsuarioItem';

const BasicCombobox = ({ usuarios }: BasicComboboxProps) => {
  const [open, setOpen] = useState<boolean>(false);
  
  // Usar el store de notificaciones
  const { 
    usuarioSeleccionado, 
    setUsuarioSeleccionado
  } = useNotificacionesStore();

  const handleSelect = useCallback((usuarioUuid: string) => {
    const selectedUsuario = usuarios.find((usuario) => usuario.uuid === usuarioUuid);
    
    if (selectedUsuario) {
      setUsuarioSeleccionado(selectedUsuario);
      setOpen(false);
    }
  }, [usuarios, setUsuarioSeleccionado]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {usuarioSeleccionado ? usuarioSeleccionado.nombre : "Seleccionar usuario..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Buscar usuario..." />
          <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
          <CommandGroup>
            {usuarios.map((usuario) => (
              <UsuarioItem
                key={usuario.uuid}
                usuario={usuario}
                isSelected={usuarioSeleccionado?.uuid === usuario.uuid}
                onSelect={handleSelect}
              />
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BasicCombobox;