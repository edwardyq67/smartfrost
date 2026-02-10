// app/[lang]/(home)/loading.tsx
export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {/* Spinner principal */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-gray-600">Cargando...</p>
        <p className="text-sm text-gray-400 mt-2">Por favor espera</p>
      </div>
    </div>
  );
}