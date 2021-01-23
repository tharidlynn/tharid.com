---
title: 'Cronjob'
description: 'A very useful website: https://crontab.guru'
date: '2018-07-13'
modified_date: '2018-07-13'
image: '/assets/images/posts/random-img.jpg'
---

A very useful website: https://crontab.guru
 
```bash
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday;
# │ │ │ │ │                                       7 is also Sunday on some systems)
# │ │ │ │ │
# │ │ │ │ │
# * * * * *  command_to_execute
```

| Command         | description     |
| ------------- |:-------------:|
| crontab -e      | Edit crontab file, or create one if it doesn’t already exist. |
| crontab -l       | crontab list of cronjobs , display crontab file contents.     |
| crontab -r  | Remove your crontab file.    |
| crontab -v    | Display the last time you edited your crontab file. (This option is only available on a few systems.)
 |






