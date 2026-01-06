import LoadingPage from "@/components/layout/LoadingPage";

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 z-9999 flex h-screen w-screen items-center justify-center bg-transparent">
      <LoadingPage />
    </div>
  );
}
