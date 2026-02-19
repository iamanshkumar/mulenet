export default function DownloadButton({ data }) {
  const dl = () => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],
        {type:'application/json'})),
      download: `mulenet_${Date.now()}.json`
    })
    a.click()
  }
  return (
    <button onClick={dl}
      className='w-full bg-green-800 hover:bg-green-700 text-white
        font-bold py-3 px-5 rounded-xl transition-colors text-sm'>
      ⬇  Download JSON Report
    </button>
  )
}
