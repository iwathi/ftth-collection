export type EquipmentType = 'node' | 'infrastructure';
export type PhaseCategory = 'kyokusha' | 'chika_kaku' | 'hikikomi_takunai';

export interface EquipmentDefinition {
  id: string;
  name: string;
  itemType: EquipmentType; // 通信機器(結線あり) or 基盤設備(配置のみ)
  category: PhaseCategory;
  phaseName: string;
  description: string;
  imageUrl: string;
  validTargets: string[]; // 順方向の正しい接続先ID (infrastructureの場合は空)
  learningPoint: string;
  unitCost: number; // 単価（円）
}

export const EQUIPMENTS_DATA: EquipmentDefinition[] = [
  // ==========================================
  // ① 通信機器（物理的に線で繋がる要素）
  // ==========================================
  {
    id: "eq_olt",
    name: "OLT",
    itemType: "node",
    category: "kyokusha",
    phaseName: "局舎・通信機器",
    description: "局側の親機。複数のユーザーの信号を束ねる役割を持ちます。",
    imageUrl: "/icons/olt.png",
    validTargets: ["eq_ftm"],
    learningPoint: "多数 of ユーザー通信をここで集約・制御している点に注目！",
    unitCost: 50000
  },
  {
    id: "eq_ftm",
    name: "FTM",
    itemType: "node",
    category: "kyokusha",
    phaseName: "局舎・通信機器",
    description: "巨大な光配線盤。物理的な線の分配を行います。",
    imageUrl: "/icons/ftm.png",
    validTargets: ["eq_chika_closure", "eq_kaku_closure", "eq_splitter_8", "eq_splitter_4"],
    learningPoint: "局内での物理的なパッチング管理の要所です。",
    unitCost: 10000
  },
  {
    id: "eq_chika_closure",
    name: "地下クロージャ",
    itemType: "node",
    category: "chika_kaku",
    phaseName: "地下・結線機器",
    description: "地下空間にあるケーブルの分岐や接続を行う密閉容器です。",
    imageUrl: "/icons/closure.png",
    validTargets: ["eq_splitter_8", "eq_splitter_4", "eq_kaku_closure"],
    learningPoint: "マンホール内の過酷な環境から光ファイバを守ります。",
    unitCost: 10000
  },
  {
    id: "eq_kaku_closure",
    name: "架空クロージャ",
    itemType: "node",
    category: "chika_kaku",
    phaseName: "架空・結線機器",
    description: "電柱のワイヤー上に吊るされる黒い箱。ケーブルを次へ分岐させます。",
    imageUrl: "/icons/closure.png",
    validTargets: ["eq_splitter_8", "eq_splitter_4", "eq_outlet"],
    learningPoint: "屋外の風雨に耐えながら、光ファイバを保護・分岐します。",
    unitCost: 10000
  },
  {
    id: "eq_splitter_8",
    name: "8分岐スプリッタ",
    itemType: "node",
    category: "chika_kaku",
    phaseName: "架空・結線機器",
    description: "1本の光ファイバをクロージャ内のスプリッタにより8本に分岐します。",
    imageUrl: "/icons/splitter.png",
    validTargets: ["eq_outlet"],
    learningPoint: "「1本の光を8家庭で共有」の設備の要。コスト効率のかなめとなる重要パーツです。",
    unitCost: 4500
  },
  {
    id: "eq_splitter_4",
    name: "4分岐スプリッタ",
    itemType: "node",
    category: "chika_kaku",
    phaseName: "架空・結線機器",
    description: "1本の光ファイバを4本に分岐します。小規模エリアや集合住宅向けに使用されます。",
    imageUrl: "/icons/splitter.png",
    validTargets: ["eq_outlet"],
    learningPoint: "4分岐はスプリッタ損失が小さく、通信距離が長いエリアにおすすめです。",
    unitCost: 6000
  },
  {
    id: "eq_outlet",
    name: "光コンセント",
    itemType: "node",
    category: "hikikomi_takunai",
    phaseName: "宅内・通信機器",
    description: "壁面に設置される出口。屋外用の頑丈な線と屋内用の柔らかい線の境界です。",
    imageUrl: "/icons/outlet.png",
    validTargets: ["eq_onu"],
    learningPoint: "ここから先は宅内！お客様が直接触れる可能性のあるポイントです。",
    unitCost: 1200
  },
  {
    id: "eq_onu",
    name: "ONU",
    itemType: "node",
    category: "hikikomi_takunai",
    phaseName: "宅内・通信機器",
    description: "光回線終端装置。光信号を電気信号に変え、ルーター等（LAN）に繋ぎます。",
    imageUrl: "/icons/onu.png",
    validTargets: [], 
    learningPoint: "この装置のおかげで、PCやスマホからインターネットの世界へ繋がります！",
    unitCost: 15000
  },

  // ==========================================
  // ② 基盤設備（箱・入れ物としての要素）
  // ==========================================
  {
    id: "infra_ntt_building",
    name: "NTTビル",
    itemType: "infrastructure",
    category: "kyokusha",
    phaseName: "基盤設備",
    description: "通信設備の中枢となる建造物。多くの通信機器を収容します。",
    imageUrl: "/icons/building.png",
    validTargets: [],
    learningPoint: "耐震性や無停電電源など、インフラを支える強固な作りが特徴です。",
    unitCost: 0
  },
  {
    id: "infra_toudo",
    name: "とう道",
    itemType: "infrastructure",
    category: "chika_kaku",
    phaseName: "基盤設備",
    description: "地下にある通信ケーブル専用の大型トンネル。断面は四角形で、上床板・側壁・歩床・下床板で構成されます。",
    imageUrl: "/icons/toudo.png",
    validTargets: [],
    learningPoint: "都市の中心部などでは、たくさんのケーブルをまとめて地下に通しています。",
    unitCost: 100000000 // 50m * 200万
  },
  {
    id: "infra_manhole",
    name: "マンホール",
    itemType: "infrastructure",
    category: "chika_kaku",
    phaseName: "基盤設備",
    description: "ボックス型の地下設備。側面に管路が接続され、ケーブルの引き通しや接続作業が行われます。",
    imageUrl: "/icons/manhole.png",
    validTargets: [],
    learningPoint: "道路の下に隠れた、地下と地上をつなぐ重要なアクセスポイントです。",
    unitCost: 5000000
  },
  {
    id: "infra_kanro",
    name: "管路",
    itemType: "infrastructure",
    category: "chika_kaku",
    phaseName: "基盤設備",
    description: "ケーブルを保護しながら通す円筒形のパイプ。マンホールとマンホール（またはとう道）を繋ぎます。",
    imageUrl: "/icons/kanro.png",
    validTargets: [],
    learningPoint: "配管の中にケーブルを通すことで、地圧や水分からケーブルを守っています。",
    unitCost: 12000000 // 30m * 40万
  },
  {
    id: "infra_riser_pole",
    name: "引き上げ電柱",
    itemType: "infrastructure",
    category: "chika_kaku",
    phaseName: "基盤設備",
    description: "地下から地上（架空）へとケーブルを立ち上げるための役割を持つ電柱です。",
    imageUrl: "/icons/pole.png",
    validTargets: [],
    learningPoint: "ここを境に「地下」から「架空（空中）」へとケーブルの旅が変わります。",
    unitCost: 400000
  },
  {
    id: "infra_pole",
    name: "電柱",
    itemType: "infrastructure",
    category: "chika_kaku",
    phaseName: "基盤設備",
    description: "架空（空中）でケーブルを支え、お客様宅の近くまで運ぶインフラです。",
    imageUrl: "/icons/pole.png",
    validTargets: [],
    learningPoint: "道路沿いに等間隔で並び、日本の隅々まで通信を届ける役割を果たしています。",
    unitCost: 100000
  },
  {
    id: "infra_house",
    name: "お客様宅",
    itemType: "infrastructure",
    category: "hikikomi_takunai",
    phaseName: "基盤設備",
    description: "光回線を利用するエンドユーザーの家屋です。",
    imageUrl: "/icons/house.png",
    validTargets: [],
    learningPoint: "通信サービスのゴール地点であり、お客様との最も大切な接点です。",
    unitCost: 0
  }
];
