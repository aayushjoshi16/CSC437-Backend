export interface IApiImageData {
  id: string;
  src: string;
  name: string;
  author: {
    id: string;
    name: string;
    avatarSrc: string;
  };
}