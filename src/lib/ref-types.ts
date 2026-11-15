export type RefSource = "mine" | "competitor";

export type SelectedRefMeta = {
  thumbUrl: string;
  source: RefSource;
  channelHandle: string;
  videoTitle: string;
};

export type RefAnalysisItem = {
  thumbUrl: string;
  source: RefSource;
  creatorFace: string;
  otherFaces: string;
  layoutToBorrow: string;
  textOnImage: string;
  doNotCopy: string;
};

export type RefAnalysisResult = {
  items: RefAnalysisItem[];
  summary: string;
};