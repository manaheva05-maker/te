import React from 'react';
import Svg, {
  Path, Circle, Polygon, Defs, LinearGradient, Stop,
  G, Ellipse, Rect, ClipPath, Line, Polyline
} from 'react-native-svg';

const GOLD = '#C9A227';
const RED = '#8B0000';
const WHITE = '#F0EAD6';

export const SwordIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="swG" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FFD700" />
        <Stop offset="1" stopColor={color} />
      </LinearGradient>
    </Defs>
    <Path d="M14.5 2.5L21 9L9 21L3 21L3 15L14.5 2.5Z" fill="url(#swG)" stroke={color} strokeWidth="1" strokeLinejoin="round"/>
    <Path d="M3 21L7 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M18 5L20 3" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M16 7L14.5 5.5" stroke="#FFD700" strokeWidth="1" strokeLinecap="round"/>
    <Circle cx="4.5" cy="19.5" r="1" fill={color} />
  </Svg>
);

export const ShieldIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="shG" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={color} stopOpacity="0.9" />
        <Stop offset="1" stopColor={RED} />
      </LinearGradient>
    </Defs>
    <Path d="M12 2L4 5V11C4 15.5 7.5 19.7 12 21C16.5 19.7 20 15.5 20 11V5L12 2Z" fill="url(#shG)" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const TrophyIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="trG" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFD700" />
        <Stop offset="1" stopColor={color} />
      </LinearGradient>
    </Defs>
    <Path d="M8 3H16V13C16 16.31 14.31 18 12 18C9.69 18 8 16.31 8 13V3Z" fill="url(#trG)" stroke={color} strokeWidth="1.5"/>
    <Path d="M4 5H8V10C8 10 6 10 5 9C4 8 4 5 4 5Z" fill={color} opacity="0.6"/>
    <Path d="M16 5H20V10C20 10 18 10 19 9C20 8 20 5 20 5Z" fill={color} opacity="0.6"/>
    <Rect x="10" y="18" width="4" height="3" fill={color}/>
    <Rect x="7" y="21" width="10" height="1.5" rx="0.75" fill={color}/>
    <Path d="M10 8L11.5 10.5L14 11L12 13L12.5 15.5L10 14L7.5 15.5L8 13L6 11L8.5 10.5L10 8Z" fill="white" opacity="0.9"/>
  </Svg>
);

export const HomeIcon = ({ size = 24, color = GOLD, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
      fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
  </Svg>
);

export const PersonIcon = ({ size = 24, color = GOLD, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="4" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8"/>
    <Path d="M4 21C4 17.13 7.58 14 12 14C16.42 14 20 17.13 20 21"
      fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);

export const LiveIcon = ({ size = 24, color = '#E74C3C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" fill={color}/>
    <Path d="M6.34 6.34C4.9 7.79 4 9.79 4 12C4 14.21 4.9 16.21 6.34 17.66" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <Path d="M17.66 6.34C19.1 7.79 20 9.79 20 12C20 14.21 19.1 16.21 17.66 17.66" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <Path d="M9.17 9.17C8.45 9.9 8 10.9 8 12C8 13.1 8.45 14.1 9.17 14.83" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M14.83 9.17C15.55 9.9 16 10.9 16 12C16 13.1 15.55 14.1 14.83 14.83" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

export const FlameIcon = ({ size = 24, color = '#FF5722' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="flG" x1="0" y1="1" x2="0" y2="0">
        <Stop offset="0" stopColor={RED} />
        <Stop offset="1" stopColor="#FF9800" />
      </LinearGradient>
    </Defs>
    <Path d="M12 2C12 2 7 8 7 13C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13C17 8 12 2 12 2Z" fill="url(#flG)"/>
    <Path d="M12 10C12 10 9.5 13 9.5 15C9.5 16.38 10.62 17.5 12 17.5C13.38 17.5 14.5 16.38 14.5 15C14.5 13 12 10 12 10Z" fill="#FF9800" opacity="0.7"/>
    <Ellipse cx="12" cy="20" rx="4" ry="2" fill={color} opacity="0.3"/>
  </Svg>
);

export const StarIcon = ({ size = 24, color = GOLD, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5" strokeLinejoin="round"
    />
  </Svg>
);

export const BoltIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round"/>
  </Svg>
);

export const CrownIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="crG" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFD700" />
        <Stop offset="1" stopColor={color} />
      </LinearGradient>
    </Defs>
    <Path d="M3 17L5 8L9 13L12 5L15 13L19 8L21 17H3Z" fill="url(#crG)" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
    <Rect x="3" y="17" width="18" height="2.5" rx="1" fill={color}/>
    <Circle cx="5" cy="8" r="1.5" fill="#FFD700"/>
    <Circle cx="12" cy="5" r="1.5" fill="#FFD700"/>
    <Circle cx="19" cy="8" r="1.5" fill="#FFD700"/>
  </Svg>
);

export const DragonIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C9 3 6 5 5 8C4 11 5 14 8 16L7 21H17L16 16C19 14 20 11 19 8C18 5 15 3 12 3Z" fill={color} opacity="0.9"/>
    <Path d="M9 8C9 8 8 9 8 10C8 11 9 12 10 12" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    <Path d="M15 8C15 8 16 9 16 10C16 11 15 12 14 12" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    <Circle cx="10" cy="9" r="1" fill="white"/>
    <Circle cx="14" cy="9" r="1" fill="white"/>
    <Path d="M5 8L2 6M19 8L22 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M12 12V14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

export const EyeIcon = ({ size = 24, color = '#E74C3C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={color} strokeWidth="1.8"/>
    <Circle cx="12" cy="12" r="4" fill={color} opacity="0.8"/>
    <Circle cx="12" cy="12" r="2" fill={color}/>
    <Circle cx="13" cy="11" r="0.8" fill="white"/>
  </Svg>
);

export const RockIcon = ({ size = 24, color = '#888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 18L7 8L12 5L17 8L20 18H4Z" fill={color} opacity="0.8" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
    <Path d="M7 8L12 10L17 8" stroke="white" strokeWidth="0.8" opacity="0.4"/>
  </Svg>
);

export const NinjaIcon = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="5" fill={color} opacity="0.9"/>
    <Path d="M4 20C4 16 7.58 13 12 13C16.42 13 20 16 20 20" fill={color} opacity="0.7"/>
    <Path d="M7 8H17M12 3V13" stroke="white" strokeWidth="1.2" opacity="0.6"/>
  </Svg>
);

export const SpiritIcon = ({ size = 24, color = '#7C4DFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 5 5 5 13C5 17 8 20 12 21C16 20 19 17 19 13C19 5 12 2 12 2Z" fill={color} opacity="0.8"/>
    <Path d="M9 13C9 11 10 10 12 10C14 10 15 11 15 13C15 15 14 16 12 16C10 16 9 15 9 13Z" fill="white" opacity="0.6"/>
    <Circle cx="10.5" cy="12" r="1" fill="white"/>
    <Circle cx="13.5" cy="12" r="1" fill="white"/>
  </Svg>
);

export const SearchIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </Svg>
);

export const BellIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8C18 5.79 15.31 4 12 4C8.69 4 6 5.79 6 8C6 14 3 16 3 16H21C21 16 18 14 18 8Z" fill={color} opacity="0.8" stroke={color} strokeWidth="1.2"/>
    <Path d="M10 16C10 17.1 10.9 18 12 18C13.1 18 14 17.1 14 16" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

export const SettingsIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
    <Path d="M12 1V4M12 20V23M1 12H4M20 12H23M4.22 4.22L6.34 6.34M17.66 17.66L19.78 19.78M19.78 4.22L17.66 6.34M6.34 17.66L4.22 19.78" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

export const LogoutIcon = ({ size = 24, color = '#E74C3C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Polyline points="16,17 21,12 16,7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);

export const ChatIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    <Line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="8" y1="13" x2="13" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

export const GemIcon = ({ size = 24, color = '#3498DB' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="gmG" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#7EC8E3" />
        <Stop offset="1" stopColor={color} />
      </LinearGradient>
    </Defs>
    <Path d="M6 3H18L22 9L12 21L2 9L6 3Z" fill="url(#gmG)" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
    <Path d="M2 9H22M6 3L12 21M18 3L12 21M6 3L2 9M18 3L22 9" stroke="white" strokeWidth="0.8" opacity="0.3"/>
  </Svg>
);

export const PlayIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="5,3 19,12 5,21" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round"/>
  </Svg>
);

export const MusicIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18V5L21 3V16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="6" cy="18" r="3" fill={color} opacity="0.8"/>
    <Circle cx="18" cy="16" r="3" fill={color} opacity="0.8"/>
  </Svg>
);

export const AddIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
    <Path d="M12 8V16M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const CloseIcon = ({ size = 24, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const ArrowLeftIcon = ({ size = 24, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const CheckIcon = ({ size = 24, color = '#2ECC71' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20,6 9,17 4,12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const WarningIcon = ({ size = 24, color = '#F39C12' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 18.99C1.55 20.1 2.45 21 3.56 21H20.44C21.55 21 22.45 20.1 22.45 18.99C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.31 12.96 3.14C12.36 2.82 11.64 2.82 11.04 3.14C10.73 3.31 10.47 3.56 10.29 3.86Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const InfoIcon = ({ size = 24, color = '#3498DB' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
    <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const ShareIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.8"/>
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.8"/>
    <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="1.8"/>
  </Svg>
);

export const MoreIcon = ({ size = 24, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="1.5" fill={color}/>
    <Circle cx="12" cy="12" r="1.5" fill={color}/>
    <Circle cx="12" cy="19" r="1.5" fill={color}/>
  </Svg>
);

export const ShinkenLogo = ({ size = 48, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="lgLogo" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FFD700"/>
        <Stop offset="0.5" stopColor={color}/>
        <Stop offset="1" stopColor={RED}/>
      </LinearGradient>
    </Defs>
    <Path d="M24 4L28 16L40 12L32 22L44 26L32 30L40 40L28 36L24 48L20 36L8 40L16 30L4 26L16 22L8 12L20 16L24 4Z" fill="url(#lgLogo)" opacity="0.9"/>
    <Circle cx="24" cy="26" r="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6"/>
    <Circle cx="24" cy="26" r="3" fill={color}/>
  </Svg>
);

export const RankIcon = ({ rank, size = 24 }) => {
  const rankColors = {
    munou:    '#888',
    genin:    '#4CAF50',
    chunin:   '#2196F3',
    jonin:    '#9C27B0',
    kage:     '#FF5722',
    akatsuki: '#F44336',
    ryuken:   GOLD,
    shinken:  '#FFD700',
  };
  const color = rankColors[rank] || '#888';

  if (rank === 'munou')    return <RockIcon size={size} color={color} />;
  if (rank === 'genin')    return <NinjaIcon size={size} color={color} />;
  if (rank === 'chunin')   return <SwordIcon size={size} color={color} />;
  if (rank === 'jonin')    return <SwordIcon size={size} color={color} />;
  if (rank === 'kage')     return <FlameIcon size={size} color={color} />;
  if (rank === 'akatsuki') return <EyeIcon size={size} color={color} />;
  if (rank === 'ryuken')   return <DragonIcon size={size} color={color} />;
  if (rank === 'shinken')  return <ShinkenLogo size={size} color={color} />;
  return <RockIcon size={size} color={color} />;
};

export const SoulIcon = ({ soul, size = 20 }) => {
  const soulColors = {
    shonen:  '#FF6B35',
    isekai:  '#7C4DFF',
    seinen:  '#455A64',
    mystere: '#00BCD4',
    dark:    '#9E9E9E',
    mecha:   '#607D8B',
    slice:   '#E91E63',
    fantasy: '#4CAF50',
    gore:    '#8B0000',
  };
  const color = soulColors[soul] || '#888';

  if (soul === 'shonen')  return <FlameIcon size={size} color={color} />;
  if (soul === 'isekai')  return <SpiritIcon size={size} color={color} />;
  if (soul === 'seinen')  return <SwordIcon size={size} color={color} />;
  if (soul === 'mystere') return <EyeIcon size={size} color={color} />;
  if (soul === 'dark')    return <EyeIcon size={size} color={color} />;
  if (soul === 'mecha')   return <SettingsIcon size={size} color={color} />;
  if (soul === 'slice')   return <StarIcon size={size} color={color} filled />;
  if (soul === 'fantasy') return <DragonIcon size={size} color={color} />;
  if (soul === 'gore')    return <FlameIcon size={size} color={color} />;
  return <StarIcon size={size} color={color} />;
};

export const TempleShinkenIcon = ({ size = 24, color = GOLD }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="18" width="20" height="3" rx="1" fill={color} opacity="0.9"/>
    <Rect x="5" y="8" width="14" height="10" fill={color} opacity="0.4" stroke={color} strokeWidth="1"/>
    <Path d="M1 8L12 2L23 8" fill={color} opacity="0.7" stroke={color} strokeWidth="1" strokeLinejoin="round"/>
    <Rect x="10" y="13" width="4" height="5" fill={color} opacity="0.8"/>
    <Rect x="7" y="11" width="2.5" height="7" fill={color} opacity="0.5"/>
    <Rect x="14.5" y="11" width="2.5" height="7" fill={color} opacity="0.5"/>
  </Svg>
);
