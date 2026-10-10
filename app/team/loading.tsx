export default function Loading() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-9">
      <div className="rp-skel h-4 w-36" />
      <div className="rp-skel mt-4 h-7 w-52" />
      <div className="card mt-6">
        <div className="rp-skel h-5 w-32" />
        <div className="rp-skel mt-5 h-9 w-full" />
        <div className="rp-skel mt-4 h-9 w-40" />
      </div>
      <div className="card mt-4">
        <div className="rp-skel h-5 w-32" />
        <div className="rp-skel mt-4 h-9 w-64" />
      </div>
    </main>
  );
}
