function submitProject(){

const formData = new FormData()

formData.append("title",title)
formData.append("description",description)
formData.append("file",file)

axios.post("/projects",formData)

}