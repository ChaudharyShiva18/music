#!/usr/bin/env python3
"""
organize.py - Standalone script to organize and update metadata for .mp3 files.

Features:
- Organizes .mp3 files into structured folders based on metadata (Artist, Album, Genre, Year).
- Utilizes existing metadata in the .mp3 files.
- Fetches and updates missing metadata using YouTube Music API.
- Downloads and embeds album covers only if not present.
- Handles duplicate files by renaming.

Dependencies:
- mutagen
- ytmusicapi
- requests

Usage:
    Simply run the script. Ensure that the source and destination directories are correctly set within the script.

Author: OpenAI ChatGPT
Date: 2024-04-27
"""

import os
import shutil
import requests
import re
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, APIC, error
from ytmusicapi import YTMusic

# Initialize YTMusic (ensure you've authorized YTMusic if needed)
ytmusic = YTMusic()

# Define Source and Destination Directories
SOURCE_DIRECTORY = '/music'         # Replace with your actual source directory
DESTINATION_DIRECTORY = '/music/organized'  # Replace with your actual destination directory

# Default values for missing metadata
DEFAULT_ARTIST = 'Unknown Artist'
DEFAULT_GENRE = 'Unknown Genre'
DEFAULT_ALBUM = 'Unknown Album'
DEFAULT_YEAR = 'Unknown Year'

def fetch_metadata(artist, album):
    """
    Fetch metadata for a given artist and album using YTMusic API.

    Args:
        artist (str): Artist name.
        album (str): Album name.

    Returns:
        dict: Metadata dictionary containing genre, year, and album art URL.
    """
    try:
        search_query = f"{artist} {album}"
        results = ytmusic.search(search_query, filter='albums')
        if not results:
            return None

        # Assume the first result is the desired album
        album_info = results[0]
        categories = album_info.get('categories', [])
        genre = categories[0].get('name', DEFAULT_GENRE) if categories else DEFAULT_GENRE
        year = album_info.get('year', DEFAULT_YEAR)
        album_art_url = album_info.get('thumbnails', [{}])[0].get('url', None)

        metadata = {
            'genre': genre,
            'year': year,
            'album_art_url': album_art_url
        }

        return metadata

    except Exception:
        return None

def fetch_and_embed_album_cover(album_art_url, file_path):
    """
    Downloads and embeds the album cover image into the specified .mp3 file.

    Args:
        album_art_url (str): URL of the album art image.
        file_path (str): Path to the .mp3 file.

    Returns:
        None
    """
    try:
        if not album_art_url:
            return

        response = requests.get(album_art_url, timeout=10)
        response.raise_for_status()

        # Embed album art
        audio = ID3(file_path)
        audio['APIC'] = APIC(
            encoding=3,  # 3 is for utf-8
            mime='image/jpeg',
            type=3,      # 3 is for the cover image
            desc='Cover',
            data=response.content
        )
        audio.save(file_path)

    except Exception:
        pass

def is_duplicate(target_folder, filename):
    """
    Checks if a file with the same name already exists in the target folder.

    Args:
        target_folder (str): Path to the target folder.
        filename (str): Filename to check.

    Returns:
        bool: True if duplicate exists, False otherwise.
    """
    return os.path.exists(os.path.join(target_folder, filename))

def sanitize_folder_name(name):
    """
    Sanitizes a string to be used as a folder name by removing or replacing invalid characters.

    Args:
        name (str): Original string.

    Returns:
        str: Sanitized string.
    """
    name = name.replace(':', '-').replace('/', '-').replace('\\', '-')
    return re.sub(r'[^a-zA-Z0-9 _\-\(\)\[\]]', '', name.strip())

def get_first_artist(artist):
    """
    Extracts the first artist from a list if multiple artists are present.

    Args:
        artist (str): Artist string, possibly containing multiple artists separated by commas or slashes.

    Returns:
        str: First artist name.
    """
    for sep in [',', '/']:
        if sep in artist:
            return artist.split(sep)[0].strip()
    return artist.strip()

def has_album_art(file_path):
    """
    Checks if the .mp3 file already has embedded album art.

    Args:
        file_path (str): Path to the .mp3 file.

    Returns:
        bool: True if album art is present, False otherwise.
    """
    try:
        audio = ID3(file_path)
        return any(key.startswith('APIC:') for key in audio.keys())
    except Exception:
        return False

def update_metadata(file_path, existing_metadata, fetched_metadata):
    """
    Updates the metadata of an MP3 file using mutagen.

    Args:
        file_path (str): Path to the MP3 file.
        existing_metadata (dict): Dictionary containing existing metadata fields.
        fetched_metadata (dict): Dictionary containing fetched metadata fields.

    Returns:
        None
    """
    try:
        audio = EasyID3(file_path)
    except error:
        audio = EasyID3()
        audio.save(file_path)

    # Update metadata fields only if they are missing or set to default
    if existing_metadata.get('artist', [DEFAULT_ARTIST])[0] == DEFAULT_ARTIST and 'artist' in fetched_metadata:
        audio['artist'] = fetched_metadata['artist']
    if existing_metadata.get('album', [DEFAULT_ALBUM])[0] == DEFAULT_ALBUM and 'album' in fetched_metadata:
        audio['album'] = fetched_metadata['album']
    if existing_metadata.get('genre', [DEFAULT_GENRE])[0] == DEFAULT_GENRE and 'genre' in fetched_metadata:
        audio['genre'] = fetched_metadata['genre']
    if existing_metadata.get('date', [DEFAULT_YEAR])[0] == DEFAULT_YEAR and 'year' in fetched_metadata:
        audio['date'] = fetched_metadata['year']
    audio.save(file_path)

def organize_and_update_metadata(source_dir, destination_dir, handle_duplicates=True):
    """
    Organizes and updates metadata for .mp3 files from the source directory to the destination directory.

    Args:
        source_dir (str): Path to the source directory.
        destination_dir (str): Path to the destination directory.
        handle_duplicates (bool): Whether to handle duplicate filenames.

    Returns:
        None
    """
    if not os.path.exists(source_dir):
        return

    if not os.path.exists(destination_dir):
        try:
            os.makedirs(destination_dir, exist_ok=True)
        except Exception:
            return

    # Iterate through all files in the source directory
    for root, _, files in os.walk(source_dir):
        for filename in files:
            if not filename.lower().endswith('.mp3'):
                continue

            source_path = os.path.join(root, filename)

            try:
                audio = EasyID3(source_path)
            except Exception:
                continue

            artist = audio.get('artist', [DEFAULT_ARTIST])[0]
            album = audio.get('album', [DEFAULT_ALBUM])[0]
            title = audio.get('title', [os.path.splitext(filename)[0]])[0]

            # Clean and sanitize metadata
            artist_clean = sanitize_folder_name(get_first_artist(artist))
            album_clean = sanitize_folder_name(album)
            genre = audio.get('genre', [DEFAULT_GENRE])[0]
            year = audio.get('date', [DEFAULT_YEAR])[0]

            # Determine if metadata fields are missing
            metadata_needs_update = any([
                artist_clean == DEFAULT_ARTIST,
                album_clean == DEFAULT_ALBUM,
                genre == DEFAULT_GENRE,
                year == DEFAULT_YEAR
            ])

            fetched_metadata = {}
            album_art_url = None

            if metadata_needs_update:
                # Fetch additional metadata from YTMusic
                fetched = fetch_metadata(artist_clean, album_clean)
                if fetched:
                    fetched_metadata = {
                        'artist': artist_clean if artist_clean != DEFAULT_ARTIST else artist_clean,  # Assuming artist is already set
                        'album': album_clean if album_clean != DEFAULT_ALBUM else album_clean,       # Assuming album is already set
                        'genre': fetched.get('genre', genre),
                        'year': fetched.get('year', year)
                    }
                    genre = fetched.get('genre', genre)
                    year = fetched.get('year', year)
                    album_art_url = fetched.get('album_art_url', None)

            # Update metadata if necessary
            if fetched_metadata:
                update_metadata(source_path, audio, fetched_metadata)
                genre = fetched_metadata.get('genre', genre)
                year = fetched_metadata.get('year', year)

            # Define the target directory structure based on updated metadata
            artist_dir = os.path.join(destination_dir, artist_clean)
            genre_dir = os.path.join(artist_dir, sanitize_folder_name(genre))
            album_dir = os.path.join(genre_dir, f"{album_clean} ({year})")

            # Create directories if they don't exist
            try:
                os.makedirs(album_dir, exist_ok=True)
            except Exception:
                continue

            # Define the destination file path
            destination_path = os.path.join(album_dir, filename)

            # Handle duplicates by renaming
            if handle_duplicates and is_duplicate(album_dir, filename):
                base, ext = os.path.splitext(filename)
                count = 1
                while True:
                    new_filename = f"{base} ({count}){ext}"
                    new_destination = os.path.join(album_dir, new_filename)
                    if not os.path.exists(new_destination):
                        destination_path = new_destination
                        break
                    count += 1

            # Move the file
            try:
                shutil.move(source_path, destination_path)
            except Exception:
                continue

            # Check if album art is already embedded
            if not has_album_art(destination_path) and album_art_url:
                fetch_and_embed_album_cover(album_art_url, destination_path)

def main():
    """
    Main function to initiate the organization process.
    """
    organize_and_update_metadata(SOURCE_DIRECTORY, DESTINATION_DIRECTORY, handle_duplicates=True)

if __name__ == "__main__":
    main()
