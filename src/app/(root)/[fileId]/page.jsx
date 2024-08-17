import FilePageContent from "./components/FilePageContent";

export default function FilePage({ params }) {
  return (
    <>
      <FilePageContent fileId={params.fileId} />
    </>
  );
}
