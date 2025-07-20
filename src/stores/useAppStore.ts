import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BattleTrack, Battle, Playlist } from '@/types';

interface AppState {
  // Current playlist being battled
  currentPlaylist: Playlist | null;
  
  // All saved playlists
  playlists: Playlist[];
  
  // Current battle state
  currentBattle: Battle | null;
  isPlaying: boolean;
  playingTrack: string | null;
  
  // Hydration state
  isHydrated: boolean;
  
  // Actions
  setHydrated: () => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (playlist: Playlist) => void;
  deletePlaylist: (playlistId: string) => void;
  
  setCurrentBattle: (battle: Battle | null) => void;
  completeBattle: (winnerId: string) => void;
  
  setPlaying: (isPlaying: boolean) => void;
  setPlayingTrack: (trackId: string | null) => void;
  
  // Battle logic
  generateNextBattle: () => Battle | null;
  calculateRankings: () => BattleTrack[];
  resetPlaylistBattles: (playlistId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPlaylist: null,
      playlists: [],
      currentBattle: null,
      isPlaying: false,
      playingTrack: null,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),
      setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
      
      addPlaylist: (playlist) => 
        set((state) => ({ 
          playlists: [...state.playlists, playlist] 
        })),
      
      updatePlaylist: (playlist) =>
        set((state) => ({
          playlists: state.playlists.map(p => p.id === playlist.id ? playlist : p),
          currentPlaylist: state.currentPlaylist?.id === playlist.id ? playlist : state.currentPlaylist
        })),
      
      deletePlaylist: (playlistId) =>
        set((state) => ({
          playlists: state.playlists.filter(p => p.id !== playlistId),
          currentPlaylist: state.currentPlaylist?.id === playlistId ? null : state.currentPlaylist
        })),

      setCurrentBattle: (battle) => set({ currentBattle: battle }),
      
      completeBattle: (winnerId) => {
        const state = get();
        const battle = state.currentBattle;
        const playlist = state.currentPlaylist;
        
        if (!battle || !playlist) return;

        const winner = battle.track1.id === winnerId ? battle.track1 : battle.track2;
        const loser = battle.track1.id === winnerId ? battle.track2 : battle.track1;
        
        // Update battle stats
        winner.wins += 1;
        winner.battles += 1;
        loser.losses += 1;
        loser.battles += 1;
        
        // Calculate new scores (win percentage)
        winner.score = winner.wins / winner.battles;
        loser.score = loser.wins / loser.battles;
        
        const completedBattle: Battle = {
          ...battle,
          winner,
          timestamp: new Date()
        };
        
        // Update playlist
        const updatedPlaylist: Playlist = {
          ...playlist,
          battles: [...playlist.battles, completedBattle],
          tracks: playlist.tracks.map(track => {
            if (track.id === winner.id) return winner;
            if (track.id === loser.id) return loser;
            return track;
          }),
          updatedAt: new Date()
        };
        
        // Check if all battles are complete
        const totalPossibleBattles = (playlist.tracks.length * (playlist.tracks.length - 1)) / 2;
        updatedPlaylist.isComplete = updatedPlaylist.battles.length >= totalPossibleBattles;
        
        set({
          currentPlaylist: updatedPlaylist
          // Don't clear currentBattle here - let the component handle it
        });
        
        // Update in stored playlists
        get().updatePlaylist(updatedPlaylist);
      },

      setPlaying: (isPlaying) => set({ isPlaying }),
      setPlayingTrack: (trackId) => set({ playingTrack: trackId }),

      generateNextBattle: () => {
        const playlist = get().currentPlaylist;
        if (!playlist || playlist.tracks.length < 2) return null;

        // Find two tracks that haven't battled each other yet
        const tracks = playlist.tracks;
        const battles = playlist.battles;
        
        for (let i = 0; i < tracks.length; i++) {
          for (let j = i + 1; j < tracks.length; j++) {
            const track1 = tracks[i];
            const track2 = tracks[j];
            
            // Check if these tracks have already battled
            const hasBattled = battles.some(battle => 
              (battle.track1.id === track1.id && battle.track2.id === track2.id) ||
              (battle.track1.id === track2.id && battle.track2.id === track1.id)
            );
            
            if (!hasBattled) {
              return {
                id: `battle-${Date.now()}-${Math.random()}`,
                track1,
                track2,
                timestamp: new Date()
              };
            }
          }
        }
        
        return null; // All battles complete
      },

      calculateRankings: () => {
        const playlist = get().currentPlaylist;
        if (!playlist) return [];
        
        return [...playlist.tracks].sort((a, b) => {
          // Primary sort by score (win percentage)
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // Secondary sort by total wins
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          // Tertiary sort by total battles (more battles = more data)
          return b.battles - a.battles;
        });
      },

      resetPlaylistBattles: (playlistId) => {
        const state = get();
        const playlist = state.playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        // Reset all track battle stats
        const resetTracks = playlist.tracks.map(track => ({
          ...track,
          wins: 0,
          losses: 0,
          battles: 0,
          score: 0
        }));

        const resetPlaylist: Playlist = {
          ...playlist,
          tracks: resetTracks,
          battles: [],
          isComplete: false,
          updatedAt: new Date()
        };

        // Update the playlist
        set((state) => ({
          playlists: state.playlists.map(p => p.id === playlistId ? resetPlaylist : p),
          currentPlaylist: state.currentPlaylist?.id === playlistId ? resetPlaylist : state.currentPlaylist
        }));
      }
    }),
    {
      name: 'trackduel-storage',
      partialize: (state) => ({
        playlists: state.playlists
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      }
    }
  )
);
