import ReactPlayer from "react-player";
import Actions from "../../components/Actions";

export default function VideoView({ data }) {
  return (
    <div className="mx-auto max-w-4xl p-2 md:p-4">
      <h2 className="text-center text-lg font-semibold">{data.fileName}</h2>
      <div className="m-0 overflow-hidden rounded-lg p-0 shadow-md">
        <div className="aspect-video">
          <ReactPlayer
            url={data.downloadUrl}
            controls={true}
            width="100%"
            height="100%"
          />
        </div>
        <div className="py-2">
          <Actions data={data} />
        </div>
      </div>
    </div>
  );
}
