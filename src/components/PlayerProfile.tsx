import React from 'react';
import { ProfileContainer, Avatar, Name, Status } from './styled_components/PlayerProfileStyles';

type PlayerProfileProps = {
  name?: string;
  avatarUrl?: string;
  isReady?: boolean;
  align: 'left' | 'right';
  showStatus: boolean;
  isSkeleton?: boolean;
};

const PlayerProfile = ({ name = '', avatarUrl, isReady = false, align, showStatus, isSkeleton = false }: PlayerProfileProps) => {
  const initials = name ? name.substring(0, 2) : '?';

  return (
    <ProfileContainer align={align}>
      <Avatar $isSkeleton={isSkeleton}>
        {!isSkeleton && avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          !isSkeleton && initials
        )}
      </Avatar>
      <Name $isSkeleton={isSkeleton}>{!isSkeleton && name}</Name>
      {showStatus && (
        <Status $ready={isReady} $isSkeleton={isSkeleton}>
          {!isSkeleton && (isReady ? 'Ready' : 'Not Ready')}
        </Status>
      )}
    </ProfileContainer>
  );
};

export default PlayerProfile;
