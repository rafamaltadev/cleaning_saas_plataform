export default function PublicNotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-6xl mb-6">🔍</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Esta empresa não foi encontrada</h1>
      <p className="text-gray-500 text-sm max-w-sm">
        O link que você acessou pode estar incorreto ou a empresa pode não estar mais disponível.
      </p>
    </div>
  );
}
