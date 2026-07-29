import { View, Text } from '@tarojs/components'
import './TaroCard.scss'

const SUIT_INFO: Record<string, { sym: string; color: string; bg: string }> = {
  spades: { sym: '♠', color: '#1a1a2e', bg: '#f0f0f5' },
  hearts: { sym: '♥', color: '#d90429', bg: '#fff5f5' },
  diamonds: { sym: '♦', color: '#d90429', bg: '#fff5f5' },
  clubs: { sym: '♣', color: '#1a1a2e', bg: '#f0f0f5' },
  joker: { sym: '★', color: '#c9a84c', bg: '#fff8e1' },
}

const RANK: Record<number, string> = {
  1:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',
  11:'J',12:'Q',13:'K',14:'A',15:'2',16:'小',17:'大'
}

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0,0]],
  2: [[0,-22],[0,22]],
  3: [[0,-22],[0,0],[0,22]],
  4: [[-18,-18],[18,-18],[-18,18],[18,18]],
  5: [[-18,-18],[18,-18],[0,0],[-18,18],[18,18]],
  6: [[-18,-18],[18,-18],[-18,0],[18,0],[-18,18],[18,18]],
  7: [[-18,-18],[18,-18],[0,-8],[-18,0],[18,0],[-18,18],[18,18]],
  8: [[-18,-18],[18,-18],[0,-8],[-18,0],[18,0],[0,8],[-18,18],[18,18]],
  9: [[-18,-18],[0,-18],[18,-18],[-18,0],[0,0],[18,0],[-18,18],[0,18],[18,18]],
  10: [[-18,-18],[18,-18],[0,-9],[-18,0],[18,0],[0,9],[-18,18],[18,18],[-18,-30],[18,-30]],
}

interface TaroCardProps {
  suit: string
  rank: number
  size?: number
  faceDown?: boolean
  onClick?: () => void
  selected?: boolean
}

export function TaroCard({ suit, rank, size = 80, faceDown, onClick, selected }: TaroCardProps) {
  const w = size
  const h = Math.round(size * 1.4)
  const info = SUIT_INFO[suit] || SUIT_INFO.spades
  const label = RANK[rank] || String(rank)
  const isJoker = suit === 'joker' || rank >= 16
  const isFace = rank >= 11 && rank <= 13

  if (faceDown) {
    return (
      <View
        className={`taro-card taro-card-back ${onClick ? 'clickable' : ''}`}
        style={{ width: w + 'px', height: h + 'px' }}
        onTap={onClick}
      >
        <View className='card-back-inner'>
          <Text className='card-back-symbol'>♠</Text>
        </View>
      </View>
    )
  }

  const pips = !isJoker && !isFace && PIP_LAYOUTS[rank]

  return (
    <View
      className={`taro-card ${selected ? 'card-selected' : ''} ${onClick ? 'clickable' : ''}`}
      style={{
        width: w + 'px',
        height: h + 'px',
        background: info.bg,
        borderColor: selected ? '#ffd700' : '#b8a88a',
      }}
      onTap={onClick}
    >
      {/* Top-left corner */}
      <View className='card-corner card-corner-tl'>
        <Text className='card-rank' style={{ color: info.color, fontSize: Math.round(w * 0.16) + 'px' }}>{label}</Text>
        <Text className='card-suit-small' style={{ color: info.color, fontSize: Math.round(w * 0.18) + 'px' }}>{info.sym}</Text>
      </View>

      {/* Center content */}
      {isJoker ? (
        <View className='card-center'>
          <Text className='card-joker' style={{ color: rank === 17 ? '#d90429' : '#1a1a2e', fontSize: Math.round(w * 0.35) + 'px' }}>
            {rank === 17 ? '大' : '小'}
          </Text>
          <Text className='card-joker-text' style={{ fontSize: Math.round(w * 0.15) + 'px' }}>JOKER</Text>
        </View>
      ) : isFace ? (
        <View className='card-center'>
          <Text style={{ color: info.color, fontSize: Math.round(w * 0.45) + 'px', fontWeight: 'bold' }}>{label}</Text>
          <Text style={{ color: info.color, fontSize: Math.round(w * 0.4) + 'px' }}>
            {rank === 13 ? '♔' : rank === 12 ? '♕' : '♖'}
          </Text>
        </View>
      ) : pips ? (
        <View className='card-center'>
          {pips.map(([x, y], i) => (
            <Text
              key={i}
              className='card-pip'
              style={{
                color: info.color,
                fontSize: Math.round(w * 0.2) + 'px',
                transform: `translate(${x * w / 90}px, ${y * h / 126}px)`,
              }}
            >
              {info.sym}
            </Text>
          ))}
        </View>
      ) : null}

      {/* Bottom-right corner */}
      <View className='card-corner card-corner-br'>
        <Text className='card-rank' style={{ color: info.color, fontSize: Math.round(w * 0.16) + 'px' }}>{label}</Text>
        <Text className='card-suit-small' style={{ color: info.color, fontSize: Math.round(w * 0.18) + 'px' }}>{info.sym}</Text>
      </View>
    </View>
  )
}
