export const dynamic = "force-dynamic";

export default function VehiclePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main style={{ padding: 40 }}>
      <h1>Vehículo ID: {params.id}</h1>
      <p>Si ves esto, la ruta dinámica funciona.</p>
    </main>
  );
}