import React from "react";
import {
View,
Text,
StyleSheet,
TouchableOpacity,
Linking,
ScrollView
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function EmergencyCallScreen() {

const makeCall = (number:string) => {
Linking.openURL(`tel:${number}`);
};

const services = [

{
name:"Police",
number:"112",
icon:"local-police",
color:"#ef4444"
},

{
name:"Ambulance",
number:"108",
icon:"medical-services",
color:"#16a34a"
},

{
name:"Fire Brigade",
number:"101",
icon:"local-fire-department",
color:"#f97316"
},

{
name:"Women Helpline",
number:"1091",
icon:"support-agent",
color:"#9333ea"
},

{
name:"Disaster Helpline",
number:"108",
icon:"warning",
color:"#0ea5e9"
}

];

return (

<ScrollView style={styles.container}>

<Text style={styles.title}>
Emergency Services
</Text>

<Text style={styles.subtitle}>
Tap any service to call instantly
</Text>


{services.map((service,index)=>(

<TouchableOpacity
key={index}
style={[styles.card,{borderLeftColor:service.color}]}
onPress={()=>makeCall(service.number)}
>

<View style={styles.iconContainer}>
<MaterialIcons
name={service.icon as any}
size={28}
color={service.color}
/>
</View>

<View style={styles.info}>

<Text style={styles.serviceName}>
{service.name}
</Text>

<Text style={styles.number}>
Call {service.number}
</Text>

</View>

<MaterialIcons
name="call"
size={24}
color={colors.primary}
/>

</TouchableOpacity>

))}

</ScrollView>

);

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:colors.background,
padding:25
},

title:{
fontSize:32,
fontWeight:"800",
color:colors.text,
marginBottom:8
},

subtitle:{
color:colors.lightText,
marginBottom:30,
fontSize:15
},

card:{
flexDirection:"row",
alignItems:"center",
backgroundColor:colors.surface,
padding:18,
borderRadius:14,
marginBottom:15,
borderLeftWidth:5,
shadowColor:"#000",
shadowOffset:{width:0,height:2},
shadowOpacity:0.05,
shadowRadius:4,
elevation:3
},

iconContainer:{
marginRight:15
},

info:{
flex:1
},

serviceName:{
fontSize:17,
fontWeight:"700",
color:colors.text
},

number:{
color:colors.lightText,
marginTop:3
}

});