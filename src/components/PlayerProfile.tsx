import React from 'react';
import { ProfileContainer, Avatar, Name, AvatarWrapper, ReadyDot } from './styled_components/PlayerProfileStyles';

type PlayerProfileProps = {
  name?: string;
  avatarUrl?: string;
  isReady?: boolean;
  align: 'left' | 'right';
  isSkeleton?: boolean;
};

const PlayerProfile = ({ name = '', avatarUrl, isReady = false, align, isSkeleton = false }: PlayerProfileProps) => {
  const initials = name ? name.substring(0, 2) : '?';

  return (
    <ProfileContainer align={align}>
      <AvatarWrapper $ready={isReady} $isSkeleton={isSkeleton}>
        <Avatar $isSkeleton={isSkeleton} $ready={isReady}>
          {!isSkeleton && avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            !isSkeleton && initials
          )}
        </Avatar>
        <ReadyDot $ready={isReady} />
      </AvatarWrapper>
      <Name $isSkeleton={isSkeleton}>{!isSkeleton && name}</Name>
    </ProfileContainer>
  );
};

export default PlayerProfile;