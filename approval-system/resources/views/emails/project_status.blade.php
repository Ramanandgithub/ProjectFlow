<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h2>Project Status Update</h2>

    <p>Project Name: {{ $project->title }}</p>

    <p>Status: {{ $status }}</p>

    <p>Action Time: {{ now() }}</p>
    
</body>
</html>