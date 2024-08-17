import ReactPlayer from "react-player";

export default function VideoView({ data }) {
  return (
    <div className="w-full">
      <div className="aspect-video">
        <ReactPlayer
          url={data.downloadUrl}
          controls={true}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}
