export default function DownloadButton({ data }) {
  const dl = () => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })),
      download: `mulenet_report_${Date.now()}.json`
    })
    a.click()
  }
  return (
    <button onClick={dl} className="btn-success w-full py-3 text-sm font-bold rounded-xl">
      ⬇ Download JSON Report
    </button>
  )
}
