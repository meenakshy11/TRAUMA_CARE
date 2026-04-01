export function PhotoGallery({ photos }: { photos: any[] }) {
  if (!photos || photos.length === 0) return (
    <div style={{ textAlign: "center", padding: 24, color: "#64748b", fontSize: 13, border: "2px dashed #1f2937", borderRadius: 8 }}>
      No scene photos uploaded
    </div>
  )
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {photos.map((p: any) => (
        <div key={p.id} style={{ aspectRatio: "1", background: "#1e293b", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24 }}>📷</span>
        </div>
      ))}
    </div>
  )
}
