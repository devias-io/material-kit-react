# file for renaming the JSON files to a readable format

import os

folder_path = '../data'

files = os.listdir(folder_path)

file_extension = '.json'

for index, filename in enumerate(files):
    # split the file path and replace the 383_posts_anon_2022 with nothing
    new_filename = os.path.splitext(filename)[0].replace('383_posts_anon_2022','')

    # change the format of the filename to be more readable
    new_filename = new_filename[0:2] + '_' + new_filename[2:4] + file_extension
    
    # Create the full file paths
    old_file_path = os.path.join(folder_path, filename)
    new_file_path = os.path.join(folder_path, new_filename)

    os.rename(old_file_path, new_file_path)